import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import usePostStore from '../store/postStore';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ArrowUp, ArrowDown, MessageSquare, Clock, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { votesApi } from '../services/api';
import toast from 'react-hot-toast';

const PostCard = ({ post, onVote }) => {
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 hover:border-neon-blue/30 transition-all duration-200">
      <div className="flex gap-3">
        {/* Votos */}
        <div className="flex flex-col items-center gap-1 min-w-[40px]">
          <button
            onClick={() => onVote(post.id, 1)}
            className="text-gray-600 hover:text-neon-blue transition-colors"
          >
            <ArrowUp size={18} />
          </button>
          <span className={`font-mono text-sm font-bold ${post.vote_score > 0 ? 'text-neon-blue' :
              post.vote_score < 0 ? 'text-neon-magenta' : 'text-gray-500'
            }`}>
            {post.vote_score}
          </span>
          <button
            onClick={() => onVote(post.id, -1)}
            className="text-gray-600 hover:text-neon-magenta transition-colors"
          >
            <ArrowDown size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="blue">/{post.board_slug}/</Badge>
            <span className="font-mono text-xs text-gray-500">
              {post.username || post.anonymous_id || 'anónimo'}
            </span>
            <span className="font-mono text-xs text-gray-600">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>

          <Link to={`/post/${post.id}`}>
            <h2 className="font-mono text-gray-200 hover:text-neon-blue transition-colors cursor-pointer truncate">
              {post.title}
            </h2>
          </Link>

          {post.content && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{post.content}</p>
          )}

          {post.image_url && (
            <img
              src={post.image_url}
              alt=""
              className="mt-2 rounded max-h-48 object-cover border border-dark-600"
            />
          )}

          <div className="flex items-center gap-3 mt-3">
            <Link
              to={`/post/${post.id}`}
              className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-neon-blue transition-colors"
            >
              <MessageSquare size={13} />
              {post.comment_count} comentarios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { posts, loading, sort, fetchPosts, setSort, setBoard, updateVoteScore } = usePostStore();

  const board = searchParams.get('board');

  useEffect(() => {
    setBoard(board);
    fetchPosts();
  }, [board, sort]);

  const handleVote = async (postId, value) => {
    try {
      await votesApi.vote('post', postId, value);
      updateVoteScore(postId, value);
    } catch {
      toast.error('Error al votar');
    }
  };

  const handleSort = (newSort) => {
    setSort(newSort);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-mono text-xl text-gray-200">
            {board ? `/${board}/` : 'todos los boards'}
          </h1>
          <p className="font-mono text-xs text-gray-600 mt-0.5">
            {posts.length} posts encontrados
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSort('new')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded font-mono text-xs border transition-all ${sort === 'new'
                ? 'border-neon-blue text-neon-blue bg-neon-blue/10'
                : 'border-dark-600 text-gray-500 hover:border-gray-500'
              }`}
          >
            <Clock size={12} /> nuevo
          </button>
          <button
            onClick={() => handleSort('popular')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded font-mono text-xs border transition-all ${sort === 'popular'
                ? 'border-neon-magenta text-neon-magenta bg-neon-magenta/10'
                : 'border-dark-600 text-gray-500 hover:border-gray-500'
              }`}
          >
            <Flame size={12} /> popular
          </button>

          <Link to="/create">
            <Button size="sm" variant="magenta">+ nuevo post</Button>
          </Link>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="font-mono text-gray-600 animate-pulse">cargando posts...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-mono text-gray-600">no hay posts aquí todavía.</p>
          <Link to="/create">
            <Button className="mt-4" variant="primary">crear el primero</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onVote={handleVote} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;