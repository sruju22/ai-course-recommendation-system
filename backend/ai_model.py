from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors

app = Flask(__name__)
CORS(app)

# ─── Database Configuration ─────────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "online_learning",
    "cursorclass": pymysql.cursors.DictCursor,
}


def get_db_connection():
    """Create and return a new database connection."""
    return pymysql.connect(**DB_CONFIG)


# ─── Helper: Fetch all progress data ────────────────────────────────
def fetch_progress_data():
    """
    Fetch user-course interaction data from the progress table.
    Each row in progress represents a completed lesson (user_id, course_id, lesson_id).
    We aggregate to get a completion count per (user_id, course_id) pair.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    p.user_id, 
                    p.course_id,
                    COUNT(DISTINCT p.lesson_id) / 
                    (SELECT COUNT(*) FROM lessons l WHERE l.course_id = p.course_id) AS progress
                FROM progress p
                GROUP BY p.user_id, p.course_id
                """
            )
            rows = cursor.fetchall()
        return rows
    finally:
        conn.close()


# ─── Helper: Fetch course details ───────────────────────────────────
def fetch_course_details(course_ids):
    """Fetch full course details for a list of course IDs."""
    if not course_ids:
        return []
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            placeholders = ", ".join(["%s"] * len(course_ids))
            cursor.execute(
                f"SELECT id, title, description, category FROM courses WHERE id IN ({placeholders})",
                course_ids,
            )
            return cursor.fetchall()
    finally:
        conn.close()


# ─── Helper: Fetch ALL courses ──────────────────────────────────────
def fetch_all_courses():
    """Fetch all courses from the database."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, title, description, category FROM courses")
            return cursor.fetchall()
    finally:
        conn.close()


# ─── KNN Recommendation Engine ──────────────────────────────────────
def knn_recommend(user_id, n_neighbors=5, n_recommendations=5):
    """
    Collaborative filtering using KNN (cosine similarity) with
    category-aware scoring for more relevant recommendations.

    Steps:
      1. Fetch all user-course-progress data and all course metadata
      2. Build a user-course pivot matrix
      3. Identify the user's learned categories
      4. Train KNN with cosine distance
      5. Find similar users
      6. Recommend courses with category-boosted scoring
      7. Fall back to category-filtered courses if KNN yields nothing

    Returns:
        list[dict]: List of course dicts with id, title, description, category
    """
    # Step 1: Fetch progress data and all course metadata (single query each)
    progress_data = fetch_progress_data()

    if not progress_data:
        return []

    df = pd.DataFrame(progress_data)

    # Check if user exists in the data
    if user_id not in df["user_id"].values:
        return []

    # Fetch all courses once for category lookup and fallback
    all_courses = fetch_all_courses()
    course_cat_map = {c["id"]: (c.get("category") or "General").lower() for c in all_courses}

    # Step 2: Build user-course matrix (rows=users, cols=courses, values=progress)
    user_course_matrix = df.pivot_table(
        index="user_id", columns="course_id", values="progress", fill_value=0
    )

    # Courses the target user has already taken
    user_index = user_course_matrix.index.get_loc(user_id)
    user_courses = set(
        user_course_matrix.columns[user_course_matrix.iloc[user_index] > 0]
    )

    # Step 3: Identify the user's learned categories
    user_categories = set()
    for cid in user_courses:
        cat = course_cat_map.get(int(cid), "general")
        user_categories.add(cat)

    print(f"🎯 User {user_id} categories: {user_categories}, enrolled: {user_courses}")

    # Need at least 2 users for collaborative filtering
    if user_course_matrix.shape[0] < 2:
        # Fall back to category-based recommendations
        return _category_fallback(all_courses, user_courses, user_categories, n_recommendations)

    # Step 4: Train KNN model with cosine similarity
    actual_neighbors = min(n_neighbors, user_course_matrix.shape[0] - 1)
    if actual_neighbors < 1:
        return _category_fallback(all_courses, user_courses, user_categories, n_recommendations)

    knn_model = NearestNeighbors(
        n_neighbors=actual_neighbors, metric="cosine", algorithm="brute"
    )
    knn_model.fit(user_course_matrix.values)

    # Step 5: Find similar users
    user_vector = user_course_matrix.iloc[user_index].values.reshape(1, -1)
    distances, indices = knn_model.kneighbors(user_vector)

    # Step 6: Aggregate recommendations with category-boosted scoring
    course_scores = {}
    CATEGORY_BOOST = 2.0  # 2x boost for same-category courses

    for i, neighbor_idx in enumerate(indices[0]):
        # Skip if neighbor is the user themselves
        if user_course_matrix.index[neighbor_idx] == user_id:
            continue

        distance = distances[0][i]
        # Cosine distance → similarity: closer to 0 = more similar
        similarity = 1 - distance if distance < 1 else 0.01

        neighbor_row = user_course_matrix.iloc[neighbor_idx]
        for course_id in user_course_matrix.columns:
            if course_id not in user_courses and neighbor_row[course_id] > 0:
                if course_id not in course_scores:
                    course_scores[course_id] = 0.0

                base_score = similarity * neighbor_row[course_id]

                # Boost score if course is in the same category as user's courses
                candidate_cat = course_cat_map.get(int(course_id), "general")
                if candidate_cat in user_categories:
                    base_score *= CATEGORY_BOOST

                course_scores[course_id] += base_score

    # If KNN found scored courses, sort and return
    if course_scores:
        sorted_courses = sorted(course_scores.items(), key=lambda x: x[1], reverse=True)
        recommended_ids = [int(cid) for cid, _ in sorted_courses[:n_recommendations]]

        # Fetch full course details
        courses = fetch_course_details(recommended_ids)

        # Preserve the ranking order
        course_map = {c["id"]: c for c in courses}
        result = [course_map[cid] for cid in recommended_ids if cid in course_map]

        if result:
            print(f"✅ KNN recommendations for user {user_id}: {[r['title'] for r in result]}")
            return result

    # Step 7: Fallback — category-based recommendations
    print(f"⚠️ KNN empty for user {user_id}, using category fallback")
    return _category_fallback(all_courses, user_courses, user_categories, n_recommendations)


def _category_fallback(all_courses, user_courses, user_categories, limit=5):
    """
    Fallback: recommend unenrolled courses matching user's categories.
    If no category match, return any unenrolled courses.
    """
    unenrolled = [c for c in all_courses if c["id"] not in user_courses]

    # Prefer same-category courses
    same_cat = [
        c for c in unenrolled
        if (c.get("category") or "General").lower() in user_categories
    ]

    if same_cat:
        return same_cat[:limit]

    # No category match — return any unenrolled
    return unenrolled[:limit]


# ─── GET /recommend?user_id=ID ───────────────────────────────────────
@app.route("/recommend", methods=["GET"])
def recommend_get():
    """
    KNN-based course recommendation endpoint.
    Query params: user_id (int)
    Returns: JSON array of recommended courses with full details.
    """
    user_id = request.args.get("user_id", type=int)

    if user_id is None:
        return jsonify([])

    try:
        recommendations = knn_recommend(user_id)
        return jsonify(recommendations)
    except Exception as e:
        print(f"❌ Recommendation error: {e}")
        return jsonify([])


# ─── POST /recommend (backward compatible with Node.js) ──────────────
@app.route("/recommend", methods=["POST"])
def recommend_post():
    """
    Backward-compatible POST endpoint for Node.js backend.
    Accepts: { categories, score, all_courses, enrolled_ids }
    Returns: JSON array of recommended courses.

    Tries KNN first from DB; falls back to content-based filtering
    using the provided payload if KNN yields no results.
    """
    data = request.json or {}

    # Try to infer user_id from the request context
    # The POST doesn't send user_id directly, so we fall back to
    # content-based filtering using the data provided by Node.js
    all_courses = data.get("all_courses", [])
    enrolled_ids = data.get("enrolled_ids", [])
    categories = data.get("categories", [])

    if not all_courses:
        return jsonify([])

    # Attempt KNN: find a user whose enrolled courses match the given enrolled_ids
    if enrolled_ids:
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                placeholders = ", ".join(["%s"] * len(enrolled_ids))
                cursor.execute(
                    f"""
                    SELECT DISTINCT user_id FROM progress
                    WHERE course_id IN ({placeholders})
                    GROUP BY user_id
                    HAVING COUNT(DISTINCT course_id) = %s
                    LIMIT 1
                    """,
                    enrolled_ids + [len(enrolled_ids)],
                )
                row = cursor.fetchone()
            conn.close()

            if row:
                recommendations = knn_recommend(row["user_id"])
                if recommendations:
                    return jsonify(recommendations[:3])
        except Exception as e:
            print(f"⚠️ KNN fallback attempt failed: {e}")

    # Fallback: simple category-based filtering (preserves original behavior)
    if not categories:
        categories = ["Programming"]

    df = pd.DataFrame(all_courses)
    if "category" not in df.columns:
        return jsonify([])

    df["category"] = df["category"].fillna("General")

    # Filter out enrolled courses
    df_filtered = df[~df["id"].isin(enrolled_ids)]

    # Match categories
    category_matched = df_filtered[
        df_filtered["category"].str.lower().apply(
            lambda cat: any(c.lower() in cat for c in categories)
        )
    ]

    if len(category_matched) > 0:
        top = category_matched.head(3)
    else:
        top = df_filtered.head(3)

    result = top[["id", "title", "category"]].to_dict(orient="records")

    # Add description if available
    if "description" in top.columns:
        for i, r in enumerate(result):
            r["description"] = top.iloc[i].get("description", "")

    return jsonify(result)


if __name__ == "__main__":
    print("🤖 ML Recommendation Service (KNN) running on port 5002")
    app.run(port=5002, debug=True)
