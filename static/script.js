document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const moodCards = document.querySelectorAll('.mood-card');
    const moviesGrid = document.getElementById('moviesGrid');
    const loading = document.getElementById('loading');
    const noMovies = document.getElementById('noMovies');
    const refreshBtn = document.getElementById('refreshBtn');
    const currentMoodText = document.getElementById('currentMoodText');
    const moodEmoji = document.getElementById('moodEmoji');
    const selectedMoodDisplay = document.getElementById('selectedMoodDisplay');
    const movieModal = document.getElementById('movieModal');
    const closeBtn = document.querySelector('.close-btn');
    
    // Current state
    let currentMood = '';
    let currentMovies = [];
    
    // Initialize with random mood
    loadRandomMoodMovies();
    
    // Mood card click event
    moodCards.forEach(card => {
        card.addEventListener('click', function() {
            const mood = this.dataset.mood;
            selectMood(mood);
        });
    });
    
    // Refresh button click event
    refreshBtn.addEventListener('click', function() {
        if (currentMood) {
            loadMovies(currentMood);
        }
    });
    
    // Close modal when clicking X
    closeBtn.addEventListener('click', function() {
        movieModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === movieModal) {
            movieModal.style.display = 'none';
        }
    });
    
    // Functions
    function selectMood(mood) {
        // Update UI
        moodCards.forEach(card => {
            card.classList.remove('active');
            if (card.dataset.mood === mood) {
                card.classList.add('active');
            }
        });
        
        // Update current mood display
        currentMood = mood;
        const moodName = getMoodName(mood);
        const moodEmojiChar = getMoodEmoji(mood);
        
        currentMoodText.textContent = `Feeling ${moodName}?`;
        moodEmoji.textContent = moodEmojiChar;
        selectedMoodDisplay.textContent = `Movies for ${moodName} mood`;
        
        // Load movies for selected mood
        loadMovies(mood);
    }
    
    function loadMovies(mood) {
        // Show loading, hide other sections
        loading.style.display = 'block';
        moviesGrid.style.display = 'none';
        noMovies.style.display = 'none';
        
        // Fetch movies from backend
        fetch('/get_recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mood: mood })
        })
        .then(response => response.json())
        .then(data => {
            loading.style.display = 'none';
            
            if (data.success && data.movies.length > 0) {
                currentMovies = data.movies;
                displayMovies(data.movies);
                moviesGrid.style.display = 'grid';
            } else {
                noMovies.style.display = 'block';
                moviesGrid.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loading.style.display = 'none';
            noMovies.style.display = 'block';
        });
    }
    
    function loadRandomMoodMovies() {
        fetch('/get_random_mood_movies')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.movies.length > 0) {
                    // Select the random mood in UI
                    const moodCard = document.querySelector(`[data-mood="${data.mood}"]`);
                    if (moodCard) {
                        moodCard.classList.add('active');
                        currentMood = data.mood;
                        const moodName = getMoodName(data.mood);
                        currentMoodText.textContent = `Feeling ${moodName}?`;
                        moodEmoji.textContent = getMoodEmoji(data.mood);
                        selectedMoodDisplay.textContent = `Movies for ${moodName} mood`;
                    }
                    
                    currentMovies = data.movies;
                    displayMovies(data.movies);
                    moviesGrid.style.display = 'grid';
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    
    function displayMovies(movies) {
        moviesGrid.innerHTML = '';
        
        movies.forEach(movie => {
            const movieCard = createMovieCard(movie);
            moviesGrid.appendChild(movieCard);
        });
    }
    
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.style.setProperty('--mood-color', movie.mood_color || '#6366f1');
    
    // Convert hex color to RGB for glow effect
    const rgb = hexToRgb(movie.mood_color || '#6366f1');
    if (rgb) {
        card.style.setProperty('--mood-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
    
    // Poster Section
    const poster = document.createElement('div');
    poster.className = 'movie-poster';
    
    if (movie.poster_url) {
        const img = document.createElement('img');
        img.src = movie.poster_url;
        img.alt = movie.title;
        img.loading = 'lazy';
        poster.appendChild(img);
    } else {
        const noPoster = document.createElement('div');
        noPoster.className = 'no-poster';
        noPoster.innerHTML = `<i class="fas fa-film"></i>`;
        poster.appendChild(noPoster);
    }
    
    // Info Section
    const info = document.createElement('div');
    info.className = 'movie-info';
    
    const genre = document.createElement('div');
    genre.className = 'movie-genre';
    genre.textContent = movie.genre || 'Film';
    
    const title = document.createElement('h3');
    title.className = 'movie-title';
    title.textContent = movie.title;
    
    const meta = document.createElement('div');
    meta.className = 'movie-meta';
    meta.innerHTML = `
        <span class="movie-year">${movie.year || 'N/A'}</span>
        <span class="movie-rating">
            <i class="fas fa-star" style="color: #facc15;"></i> ${movie.rating || 'N/A'}
        </span>
    `;
    
    const description = document.createElement('p');
    description.className = 'movie-description';
    description.textContent = movie.description ? movie.description.substring(0, 120) + '...' : 'No description available.';
    
    // Append in professional order
    info.appendChild(genre);
    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(description);
    
    card.appendChild(poster);
    card.appendChild(info);
    
    // Add click event to show details
    card.addEventListener('click', function() {
        showMovieDetails(movie);
    });
    
    return card;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
    
// Update the showMovieDetails function
function showMovieDetails(movie) {
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner"></div>
            <p>Loading movie details...</p>
        </div>
    `;
    
    movieModal.style.display = 'block';
    
    // Get detailed movie info
    fetch(`/get_movie_details/${movie.id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayEnhancedMovieDetails(data.details, movie);
            } else {
                displayMovieDetails(movie, movie);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayMovieDetails(movie, movie);
        });
}

// New function for enhanced details
function displayEnhancedMovieDetails(details, originalMovie) {
    const modalBody = document.getElementById('modalBody');
    
    const runtime = details.runtime ? `${details.runtime} min` : 'Not specified';
    const tagline = details.tagline ? `<p class="tagline" style="font-style: italic; color: #ffa726; margin: 10px 0;">"${details.tagline}"</p>` : '';
    
    // Streaming providers HTML
    let streamingHTML = '';
    if (details.streaming && details.streaming.length > 0) {
        streamingHTML = `
            <div class="modal-streaming">
                <h3><i class="fas fa-tv"></i> Available On</h3>
                <div class="provider-list">
                    ${details.streaming.map(provider => `
                        <div class="provider-badge">
                            <i class="fas fa-play-circle"></i> ${provider}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Trailer HTML
    let trailerHTML = '';
    if (details.trailer && details.trailer.key) {
        trailerHTML = `
            <div class="trailer-section">
                <h3><i class="fas fa-film"></i> Watch Trailer</h3>
                <div class="trailer-container">
                    <iframe 
                        src="https://www.youtube.com/embed/${details.trailer.key}" 
                        title="${details.trailer.name}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>
            </div>
        `;
    } else {
        trailerHTML = `
            <div class="trailer-section">
                <h3><i class="fas fa-film"></i> Trailer</h3>
                <div class="no-trailer">
                    <i class="fas fa-video-slash fa-2x"></i>
                    <p>No trailer available</p>
                </div>
            </div>
        `;
    }
    
    // Cast HTML
    let castHTML = '';
    if (details.cast && details.cast.length > 0) {
        castHTML = `
            <div class="cast-section">
                <h3><i class="fas fa-users"></i> Starring</h3>
                <div class="cast-list">
                    ${details.cast.map(actor => `
                        <div class="cast-member">${actor}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        <div class="movie-details">
            <div class="details-header">
                <h2>${details.title || originalMovie.title}</h2>
                <div class="movie-stats">
                    <div class="stat-item">
                        <div class="stat-value">${details.rating || originalMovie.rating}</div>
                        <div class="stat-label">Rating</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${details.release_date ? details.release_date.substring(0,4) : originalMovie.year}</div>
                        <div class="stat-label">Year</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${runtime}</div>
                        <div class="stat-label">Duration</div>
                    </div>
                </div>
                ${tagline}
            </div>
            
            <div class="details-content">
                <div class="details-poster">
                    ${details.poster_url ? 
                        `<img src="${details.poster_url}" alt="${details.title}">` : 
                        `<div class="no-poster-large"><i class="fas fa-film fa-5x"></i></div>`
                    }
                </div>
                
                <div class="details-info">
                    <div class="genres">
                        ${(details.genres || originalMovie.genre.split(', ')).map(genre => 
                            `<span class="genre-tag">${genre}</span>`
                        ).join('')}
                    </div>
                    
                    ${streamingHTML}
                    
                    <h3>Overview</h3>
                    <p class="overview">${details.overview || originalMovie.description}</p>
                    
                    ${details.director ? `
                        <div class="director-section">
                            <h4><i class="fas fa-user-tie"></i> Director</h4>
                            <p>${details.director}</p>
                        </div>
                    ` : ''}
                    
                    ${castHTML}
                    
                    ${trailerHTML}
                    
                    <div class="mood-match">
                        <h3><i class="fas fa-heart"></i> Why this matches your mood</h3>
                        <p>This movie is perfect for your <strong>${getMoodName(currentMood)}</strong> mood. The genre and tone align with what you're feeling right now!</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}
    
    function displayMovieDetails(details, originalMovie) {
        const modalBody = document.getElementById('modalBody');
        
        const genres = details.genres || originalMovie.genre || ['Not specified'];
        const runtime = details.runtime ? `${details.runtime} min` : 'Not specified';
        const tagline = details.tagline ? `<p class="tagline">"${details.tagline}"</p>` : '';
        
        modalBody.innerHTML = `
            <div class="movie-details">
                <div class="details-header">
                    <h2>${details.title || originalMovie.title}</h2>
                    <div class="details-meta">
                        <span class="year">${details.release_date ? details.release_date.substring(0,4) : originalMovie.year}</span>
                        <span class="rating"><i class="fas fa-star"></i> ${details.rating || originalMovie.rating}</span>
                        <span class="runtime"><i class="fas fa-clock"></i> ${runtime}</span>
                    </div>
                    ${tagline}
                </div>
                
                <div class="details-content">
                    <div class="details-poster">
                        ${details.poster_url ? 
                            `<img src="${details.poster_url}" alt="${details.title}">` : 
                            `<div class="no-poster-large"><i class="fas fa-film fa-5x"></i></div>`
                        }
                    </div>
                    
                    <div class="details-info">
                        <div class="genres">
                            ${genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                        </div>
                        
                        <h3>Overview</h3>
                        <p class="overview">${details.overview || originalMovie.description}</p>
                        
                        <div class="mood-match">
                            <h3><i class="fas fa-heart"></i> Why this matches your mood</h3>
                            <p>This movie is perfect for your <strong>${getMoodName(currentMood)}</strong> mood because it has elements that align with what you're feeling right now.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Helper functions
    function getMoodName(moodId) {
        const moodNames = {
            'happy': 'Joyful',
            'sad': 'Melancholic',
            'excited': 'Energetic',
            'relaxed': 'Peaceful',
            'adventurous': 'Adventurous',
            'romantic': 'Romantic',
            'inspired': 'Inspired',
            'scared': 'Thrilling',
            'thoughtful': 'Contemplative'
        };
        return moodNames[moodId] || 'this';
    }
    
    function getMoodEmoji(moodId) {
        const moodEmojis = {
            'happy': '😊',
            'sad': '😢',
            'excited': '🤩',
            'relaxed': '😌',
            'adventurous': '🗺️',
            'romantic': '💖',
            'inspired': '✨',
            'scared': '😨',
            'thoughtful': '🤔'
        };
        return moodEmojis[moodId] || '🎬';
    }
});