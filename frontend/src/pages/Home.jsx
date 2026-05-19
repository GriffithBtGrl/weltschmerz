import { useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import usePostStore from '../store/postStore';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ArrowUp, ArrowDown, MessageSquare, Clock, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { votesApi } from '../services/api';
import toast from 'react-hot-toast';

const saveScroll = () => sessionStorage.setItem('homeScroll', window.scrollY);

const PostCard = ({ post, onVote }) => {
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 hover:border-neon-blue/30 transition-all duration-200">
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          {post.avatar_url ? (
            <img src={post.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-dark-600" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center font-mono text-xs text-neon-blue">
              {(post.username || '?')[0].toUpperCase()}
            </div>
          )}
          <Badge variant="blue">/{post.board_slug}/</Badge>
          {post.username ? (
            <Link to={`/user/${post.username}`} className="font-mono text-xs text-gray-500 hover:text-neon-blue transition-colors">
              {post.username}
            </Link>
          ) : (
            <span className="font-mono text-xs text-gray-500">
              {post.anonymous_id ? post.anonymous_id.substring(0, 10) : 'anónimo'}
            </span>
          )}
          {post.role === 'admin' && <Badge variant="magenta">admin</Badge>}
          <span className="font-mono text-xs text-gray-600">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
          </span>
        </div>

        {/* Título y contenido */}
        <div>
          <Link to={`/post/${post.id}`} onClick={saveScroll}>
            <h2 className="font-mono text-gray-200 hover:text-neon-blue transition-colors cursor-pointer">
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
        </div>

        {/* Votos */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onVote(post.id, 1)}
            className={`flex items-center gap-1 transition-colors font-mono text-xs
              ${post.user_vote === 1 ? 'text-neon-blue' : 'text-gray-600 hover:text-neon-blue'}`}
          >
            <ArrowUp size={14} /> {post.upvotes || 0}
          </button>
          <button
            onClick={() => onVote(post.id, -1)}
            className={`flex items-center gap-1 transition-colors font-mono text-xs
              ${post.user_vote === -1 ? 'text-neon-magenta' : 'text-gray-600 hover:text-neon-magenta'}`}
          >
            <ArrowDown size={14} /> {post.downvotes || 0}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3">
          <Link
            to={`/post/${post.id}`}
            onClick={saveScroll}
            className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-neon-blue transition-colors"
          >
            <MessageSquare size={13} />
            {post.comment_count} comentarios
          </Link>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [searchParams] = useSearchParams();
  const { posts, loading, loadingMore, hasMore, sort, fetchPosts, fetchMorePosts, setSort, setBoard } = usePostStore();

  const board = searchParams.get('board');

  const prevBoardRef = useRef(board);
  const prevSortRef = useRef(sort);

  useEffect(() => {
    setBoard(board);
    const boardChanged = prevBoardRef.current !== board;
    const sortChanged = prevSortRef.current !== sort;

    if (posts.length === 0 || boardChanged || sortChanged) {
      prevBoardRef.current = board;
      prevSortRef.current = sort;
      fetchPosts();
    } else {
      const savedScroll = sessionStorage.getItem('homeScroll');
      if (savedScroll) {
        const pos = parseInt(savedScroll);
        sessionStorage.removeItem('homeScroll');
        setTimeout(() => window.scrollTo(0, pos), 50);
      }
    }
  }, [board, sort]);

  useEffect(() => {
    if (!loading && posts.length > 0) {
      const savedScroll = sessionStorage.getItem('homeScroll');
      if (savedScroll) {
        const pos = parseInt(savedScroll);
        sessionStorage.removeItem('homeScroll');
        setTimeout(() => window.scrollTo(0, pos), 50);
      }
    }
  }, [loading]);

  // Scroll infinito
  useEffect(() => {
    const handleScroll = () => {
      const scrolledTo = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const nearBottom = pageHeight - scrolledTo < 300;
      if (nearBottom && !loadingMore && hasMore) {
        fetchMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore]);

  const handleVote = async (postId, value) => {
    try {
      await votesApi.vote('post', postId, value);
      usePostStore.setState((state) => ({
        posts: state.posts.map((p) => {
          if (p.id !== postId) return p;
          const prevVote = p.user_vote !== null ? Number(p.user_vote) : null;
          const removing = prevVote === value;
          return {
            ...p,
            user_vote: removing ? null : value,
            upvotes: value === 1
              ? removing ? (p.upvotes || 0) - 1 : (p.upvotes || 0) + 1
              : prevVote === 1 ? (p.upvotes || 0) - 1 : p.upvotes,
            downvotes: value === -1
              ? removing ? (p.downvotes || 0) - 1 : (p.downvotes || 0) + 1
              : prevVote === -1 ? (p.downvotes || 0) - 1 : p.downvotes,
          };
        }),
      }));
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
        <>
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onVote={handleVote} />
            ))}
          </div>

          {/* Indicador de carga */}
          {loadingMore && (
            <div className="flex items-center justify-center py-6">
              <span className="font-mono text-xs text-gray-600 animate-pulse">cargando más posts...</span>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="flex items-center justify-center py-6">
              <span className="font-mono text-xs text-gray-600">— fin —</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default Home;