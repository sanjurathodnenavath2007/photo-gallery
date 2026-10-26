import { useState, useEffect, useReducer, useCallback, useMemo } from 'react';
import './App.css';

interface Photo {
  id: string;
  author: string;
  download_url: string;
}

function useFetchPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('https://picsum.photos/v2/list?limit=30')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load photos.');
        return response.json();
      })
      .then((data: Photo[]) => setPhotos(data))
      .catch(() => setError('Unable to load photos. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return { photos, loading, error };
}

type FavoriteAction = { type: 'toggle'; id: string };

function favoritesReducer(state: string[], action: FavoriteAction) {
  switch (action.type) {
    case 'toggle':
      return state.includes(action.id)
        ? state.filter((id) => id !== action.id)
        : [...state, action.id];
    default:
      return state;
  }
}

function getSavedFavorites(): string[] {
  try {
    const saved = localStorage.getItem('celebrare-favorites');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const { photos, loading, error } = useFetchPhotos();
  const [search, setSearch] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);

  const [favorites, dispatch] = useReducer(
    favoritesReducer,
    [],
    getSavedFavorites
  );

  useEffect(() => {
    localStorage.setItem('celebrare-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value);
    },
    []
  );

  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      const matchesAuthor = photo.author
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFavorites =
        !showFavorites || favorites.includes(photo.id);

      return matchesAuthor && matchesFavorites;
    });
  }, [photos, search, showFavorites, favorites]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
            CELEBRARE · PHOTO GALLERY
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            Discover beautiful moments.
          </h1>
          <p className="text-slate-500 mt-2">
            Explore photos, find your favourites, and save them for later.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-8">
          <input
            type="search"
            value={search}
            onChange={handleSearch}
            placeholder="Search photographers by name..."
            aria-label="Search photos by author"
            className="w-full sm:max-w-md rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
          />

          <button
            onClick={() => setShowFavorites((value) => !value)}
            className={`rounded-xl px-5 py-3 font-semibold transition ${
              showFavorites
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-slate-300 text-slate-700'
            }`}
          >
            ♥ {showFavorites ? 'Show all photos' : 'Favourites'} ({favorites.length})
          </button>
        </div>

        {loading && (
          <div className="py-20 text-center" role="status">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            <p className="mt-4 text-slate-500">Loading beautiful photos...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            {error}
            <button
              onClick={() => window.location.reload()}
              className="ml-3 underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredPhotos.length === 0 && (
          <p className="py-16 text-center text-slate-500">
            No photos found. Try another search.
          </p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => {
              const isFavorite = favorites.includes(photo.id);

              return (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={photo.download_url}
                    alt={`Photograph by ${photo.author}`}
                    loading="lazy"
                    className="h-56 w-full object-cover"
                  />

                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Photographer
                      </p>
                      <h2 className="mt-1 truncate font-semibold">
                        {photo.author}
                      </h2>
                    </div>

                    <button
                      onClick={() =>
                        dispatch({ type: 'toggle', id: photo.id })
                      }
                      aria-label={
                        isFavorite
                          ? `Remove ${photo.author} from favourites`
                          : `Add ${photo.author} to favourites`
                      }
                      aria-pressed={isFavorite}
                      className={`shrink-0 rounded-full px-3 py-2 text-xl ${
                        isFavorite
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-slate-100 text-slate-400 hover:text-rose-500'
                      }`}
                    >
                      {isFavorite ? '♥' : '♡'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && (
          <p className="mt-8 text-center text-sm text-slate-500">
            Showing {filteredPhotos.length} of {photos.length} photos
          </p>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        Built with React · Powered by Picsum Photos
      </footer>
    </div>
  );
}
