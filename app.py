from flask import Flask, render_template, request, jsonify
import random
from utils.movie_fetcher import MovieFetcher
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Initialize movie fetcher
movie_fetcher = MovieFetcher()
print(f"Loaded TMDB API KEY: {Config.TMDB_API_KEY[:5]}...") # Log first few chars

# Available moods with professional curation
MOODS = [
    {'id': 'happy', 'name': 'Happy', 'color': '#FFD93D', 'icon': 'fa-smile'},
    {'id': 'sad', 'name': 'Sad', 'color': '#4DA8DA', 'icon': 'fa-sad-tear'},
    {'id': 'romantic', 'name': 'Romantic', 'color': '#FF4D6D', 'icon': 'fa-heart'},
    {'id': 'action', 'name': 'Action', 'color': '#FF6B00', 'icon': 'fa-bolt'},
    {'id': 'motivational', 'name': 'Motivational', 'color': '#7C3AED', 'icon': 'fa-fire'},
    {'id': 'thriller', 'name': 'Thriller', 'color': '#2DD4BF', 'icon': 'fa-mask'},
    {'id': 'horror', 'name': 'Horror', 'color': '#8B0000', 'icon': 'fa-ghost'},
    {'id': 'calm', 'name': 'Calm', 'color': '#6EE7B7', 'icon': 'fa-leaf'}
]

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/')
def index():
    """Render the landing page"""
    # Fetch some random cool movies for the "preview" section
    random_mood = random.choice(['action', 'thriller'])
    preview_movies = movie_fetcher.fetch_movies_by_mood(random_mood)
    if preview_movies:
        preview_movies = preview_movies[:6]  # Take 6 movies for preview grid
    else:
        preview_movies = []
        
    return render_template('index.html', moods=MOODS[:6], preview_movies=preview_movies) # Show 6 moods for preview

@app.route('/moods')
def moods():
    """Render the full screen mood selection grid"""
    return render_template('moods.html', moods=MOODS)

@app.route('/movies/<mood_id>')
def movie_results(mood_id):
    """Render the movie results page for a specific mood"""
    mood_data = next((m for m in MOODS if m['id'] == mood_id.lower()), MOODS[0])
    return render_template('results.html', mood=mood_data, moods=MOODS)

@app.route('/admin-login')
def admin_login():
    """Render the admin login page"""
    return render_template('admin_login.html')

@app.route('/admin-dashboard')
def admin_dashboard():
    """Render the admin dashboard page"""
    return render_template('admin_dashboard.html')

@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    """Get movie recommendations based on mood"""
    try:
        data = request.get_json()
        mood = data.get('mood', 'happy').lower()
        
        # Get movies based on mood
        movies = movie_fetcher.fetch_movies_by_mood(mood)
        
        if movies:
            # Sort by rating (highest first)
            movies.sort(key=lambda x: x.get('rating', 0), reverse=True)
            
            # Add mood-specific color
            mood_color = next((m['color'] for m in MOODS if m['id'] == mood), '#FFD93D')
            for movie in movies:
                movie['mood_color'] = mood_color
            
            return jsonify({
                'success': True,
                'mood': mood,
                'mood_name': next((m['name'] for m in MOODS if m['id'] == mood), 'Happy'),
                'movies': movies,
                'count': len(movies),
                'genre_info': f"Movies from {len(movies)} different genres matching your mood"
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No movies found',
                'movies': []
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'movies': []
        })

@app.route('/get_movie_details/<int:movie_id>')
def get_movie_details(movie_id):
    """Get detailed information for a specific movie"""
    try:
        details = movie_fetcher.get_movie_details(movie_id)
        if details:
            return jsonify({'success': True, 'details': details})
        else:
            return jsonify({'success': False, 'error': 'Movie not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/get_streaming_info/<int:movie_id>')
def get_streaming_info(movie_id):
    """Get streaming information for a movie"""
    try:
        providers = movie_fetcher._get_streaming_providers(movie_id)
        return jsonify({'success': True, 'providers': providers})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=False, port=5000)