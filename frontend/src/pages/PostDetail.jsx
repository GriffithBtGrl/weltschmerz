import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUp, ArrowDown, MessageSquare, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import usePostStore from '../store/postStore';
import { commentsApi, votesApi } from '../services/api';
import useAuthStore from '../store/authStore';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';

// Componente recursivo de comentario
const Comment = ({ comment, postId, onReplyCreated, depth = 0 }) => {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await commentsApi.create(postId, {
        content: replyText,
        parent_id: comment.id,
      });
      setReplyText('');
      setReplying(false);
      onReplyCreated();
      toast.success('Respuesta publicada');
    } catch {
      toast.error('Error al publicar respuesta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      await votesApi.vote('comment', comment.id, 1);
      setTimeout(() => onReplyCreated(), 300);
    } catch {
      toast.error('Error al dar like');
    }
  }

  const borderColors = [
    'border-neon-blue/40',
    'border-neon-magenta/40',
    'border-neon-green/40',
    'border-yellow-500/40',
    'border-purple-500/40',
    'border-orange-500/40',
  ];


  return (
    <div className={`border-l-2 pl-3 ${borderColors[depth % borderColors.length]}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {comment.avatar_url && (
          <img src={comment.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover border border-dark-600" />
        )}
        {comment.username ? (
          <Link to={`/user/${comment.username}`} className="font-mono text-xs text-neon-blue hover:text-neon-blue/70 transition-colors">
            {comment.username}
          </Link>
        ) : (
          <span className="font-mono text-xs text-neon-blue">
            {comment.anonymous_id || 'anónimo'}
          </span>
        )}
        {comment.role === 'admin' && <Badge variant="magenta">admin</Badge>}
        <span className="font-mono text-xs text-gray-600">
          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
        </span>
      </div>

      {/* Contenido */}
      <p className="text-gray-300 text-sm mb-2 whitespace-pre-wrap">{comment.content}</p>

      {/* Acciones */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 font-mono text-xs transition-colors text-gray-600 hover:text-neon-blue"
        >
          <ArrowUp size={16} className={comment.upvotes > 0 ? 'text-neon-blue' : ''} />
          <span className={comment.upvotes > 0 ? 'text-neon-blue' : ''}>
            {comment.upvotes || 0}
          </span>
        </button>
        {depth < 6 && (
          <button
            onClick={() => setReplying(!replying)}
            className="font-mono text-xs text-gray-600 hover:text-neon-blue transition-colors"
          >
            {replying ? 'cancelar' : 'responder'}
          </button>
        )}
      </div>
      {/* Reply form */}
      {replying && (
        <div className="flex flex-col gap-2 mb-3">
          <Textarea
            placeholder="Tu respuesta..."
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" loading={submitting} onClick={handleReply}>
              responder
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
              cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Replies recursivas */}
      {comment.replies?.length > 0 && (
        <div className="flex flex-col gap-3 mt-3">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              postId={postId}
              onReplyCreated={onReplyCreated}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PostDetail = () => {
  const { id } = useParams();
  const { currentPost, fetchPost, loading, updateVoteScore } = usePostStore();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost(id);
    loadComments();
  }, [id]);

  const loadComments = async () => {
    try {
      const { data } = await commentsApi.getAll(id);
      setComments(data);
    } catch {
      toast.error('Error al cargar comentarios');
    }
  };

  const handleVote = async (value) => {
    try {
      await votesApi.vote('post', id, value);
      usePostStore.setState((state) => ({
        currentPost: state.currentPost ? {
          ...state.currentPost,
          upvotes: value === 1 ? (state.currentPost.upvotes || 0) + 1 : state.currentPost.upvotes,
          downvotes: value === -1 ? (state.currentPost.downvotes || 0) + 1 : state.currentPost.downvotes,
        } : null,
      }));
    } catch {
      toast.error('Error al votar');
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await commentsApi.create(id, { content: newComment });
      setNewComment('');
      loadComments();
      toast.success('Comentario publicado');
    } catch {
      toast.error('Error al publicar comentario');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <span className="font-mono text-gray-600 animate-pulse">cargando...</span>
    </div>
  );

  if (!currentPost) return (
    <div className="text-center py-20">
      <p className="font-mono text-gray-600">post no encontrado.</p>
      <Link to="/"><Button className="mt-4">volver</Button></Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back */}
      <Link to="/" className="flex items-center gap-1 font-mono text-xs text-gray-600 hover:text-neon-blue transition-colors mb-4">
        <ArrowLeft size={13} /> volver al feed
      </Link>

      {/* Post */}
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-5 mb-6">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentPost.avatar_url ? (
              <img src={currentPost.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-dark-600" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center font-mono text-xs text-neon-blue">
                {(currentPost.username || '?')[0].toUpperCase()}
              </div>
            )}
            <Badge variant="blue">/{currentPost.board_slug}/</Badge>
            {currentPost.username ? (
              <Link to={`/user/${currentPost.username}`} className="font-mono text-xs text-gray-500 hover:text-neon-blue transition-colors">
                {currentPost.username}
              </Link>
            ) : (
              <span className="font-mono text-xs text-gray-500">
                {currentPost.anonymous_id || 'anónimo'}
              </span>
            )}
            {currentPost.role === 'admin' && <Badge variant="magenta">admin</Badge>}
            <span className="font-mono text-xs text-gray-600">
              {formatDistanceToNow(new Date(currentPost.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>



          {/* Título */}
          <h1 className="font-mono text-lg text-gray-100">{currentPost.title}</h1>

          {/* Contenido */}
          {currentPost.content && (
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{currentPost.content}</p>
          )}

          {currentPost.image_url && (
            <img src={currentPost.image_url} alt="" className="rounded border border-dark-600 max-w-full" />
          )}

          <div className="flex items-center gap-1 font-mono text-xs text-gray-600">
            <MessageSquare size={13} />
            {currentPost.comment_count} comentarios
          </div>
        </div>
      </div>

      {/* Votos */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleVote(1)}
          disabled={currentPost.user_vote === 1}
          className={`flex items-center gap-1 font-mono text-sm transition-colors
      ${currentPost.user_vote === 1
              ? 'text-neon-blue cursor-not-allowed'
              : 'text-gray-600 hover:text-neon-blue'
            }`}
        >
          <ArrowUp size={16} /> {currentPost.upvotes || 0}
        </button>
        <button
          onClick={() => handleVote(-1)}
          disabled={currentPost.user_vote === -1}
          className={`flex items-center gap-1 font-mono text-sm transition-colors
      ${currentPost.user_vote === -1
              ? 'text-neon-magenta cursor-not-allowed'
              : 'text-gray-600 hover:text-neon-magenta'
            }`}
        >
          <ArrowDown size={16} /> -{currentPost.downvotes || 0}
        </button>
      </div>

      {/* Nuevo comentario */}
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 mb-6">
        <h3 className="font-mono text-xs text-gray-400 uppercase tracking-wider mb-3">
          dejar comentario
        </h3>
        <Textarea
          placeholder="Escribe algo... puedes ser anónimo."
          rows={4}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <Button variant="primary" loading={submitting} onClick={handleComment}>
            comentar
          </Button>
        </div>
      </div>

      {/* Lista de comentarios */}
      <div className="flex flex-col gap-4">
        <h3 className="font-mono text-xs text-gray-400 uppercase tracking-wider">
          {comments.length} comentarios
        </h3>
        {comments.length === 0 ? (
          <p className="font-mono text-sm text-gray-600">sé el primero en comentar.</p>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              postId={id}
              onReplyCreated={loadComments}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PostDetail;