import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';
import { Trash2, Pin, Users, FileText, MessageSquare, ThumbsUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 flex items-center gap-4">
    <Icon size={24} className={color} />
    <div>
      <p className="font-mono text-2xl font-bold text-gray-100">{value}</p>
      <p className="font-mono text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

const Admin = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, postsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/posts'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setPosts(postsRes.data);
      setUsers(usersRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    if (!confirm('¿Eliminar este post?')) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Post eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const pinPost = async (id) => {
    try {
      const { data } = await api.patch(`/admin/posts/${id}/pin`);
      setPosts(posts.map(p => p.id === id ? { ...p, is_pinned: data.is_pinned } : p));
      toast.success(data.is_pinned ? 'Post pineado' : 'Post despineado');
    } catch {
      toast.error('Error al pinear');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <span className="font-mono text-gray-600 animate-pulse">cargando panel...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-mono text-xl text-neon-magenta">
          &gt; panel de administración
        </h1>
        <p className="font-mono text-xs text-gray-600 mt-1">
          bienvenida, {user?.username}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={FileText}     label="posts"        value={stats.posts}    color="text-neon-blue" />
          <StatCard icon={Users}        label="usuarios"     value={stats.users}    color="text-neon-magenta" />
          <StatCard icon={MessageSquare} label="comentarios" value={stats.comments} color="text-neon-green" />
          <StatCard icon={ThumbsUp}     label="votos"        value={stats.votes}    color="text-yellow-400" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['posts', 'usuarios'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-mono text-xs px-4 py-2 rounded border transition-all ${
              tab === t
                ? 'border-neon-magenta text-neon-magenta bg-neon-magenta/10'
                : 'border-dark-600 text-gray-500 hover:border-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === 'posts' && (
        <div className="flex flex-col gap-2">
          {posts.map((post) => (
            <div key={post.id} className="bg-dark-800 border border-dark-600 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="blue">/{post.board_slug}/</Badge>
                    {post.is_pinned && <Badge variant="magenta">pineado</Badge>}
                    <span className="font-mono text-xs text-gray-500">
                      {post.username || post.anonymous_id || 'anónimo'}
                    </span>
                    {post.email && (
                      <span className="font-mono text-xs text-gray-600">({post.email})</span>
                    )}
                    <span className="font-mono text-xs text-gray-600">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <p className="font-mono text-sm text-gray-200 truncate">{post.title}</p>
                  <div className="flex gap-3 mt-1 font-mono text-xs text-gray-600">
                    <span>↑ {post.vote_score}</span>
                    <span>💬 {post.comment_count}</span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => pinPost(post.id)}
                    className={`p-1.5 rounded border transition-colors ${
                      post.is_pinned
                        ? 'border-neon-magenta text-neon-magenta'
                        : 'border-dark-600 text-gray-600 hover:border-neon-magenta hover:text-neon-magenta'
                    }`}
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-1.5 rounded border border-dark-600 text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usuarios tab */}
      {tab === 'usuarios' && (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="bg-dark-800 border border-dark-600 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-200">{u.username}</span>
                  {u.role === 'admin' && <Badge variant="magenta">admin</Badge>}
                </div>
                <span className="font-mono text-xs text-gray-600">{u.email}</span>
              </div>
              <span className="font-mono text-xs text-gray-600">
                {formatDistanceToNow(new Date(u.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;