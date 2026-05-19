import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usersApi } from '../services/api';
import Badge from '../components/ui/Badge';
import { ArrowUp, ArrowDown, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const AnonProfile = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const anonId = localStorage.getItem('anonymous_id');

    useEffect(() => {
        if (!anonId) {
            setLoading(false);
            return;
        }
        usersApi.getAnonProfile(anonId)
            .then(res => setData(res.data))
            .catch(() => toast.error('Error al cargar perfil'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <span className="font-mono text-gray-600 animate-pulse">cargando...</span>
        </div>
    );

    if (!anonId) return (
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
            <p className="font-mono text-gray-600">no tienes un id anónimo todavía.</p>
            <p className="font-mono text-xs text-gray-700 mt-2">publica algo primero.</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="bg-dark-800 border border-dark-600 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-dark-700 border border-neon-blue/30 flex items-center justify-center font-mono text-lg text-neon-blue">
                        ?
                    </div>
                    <div>
                        <h1 className="font-mono text-lg text-gray-200">anónimo</h1>
                        <p className="font-mono text-xs text-gray-600">{anonId}</p>
                    </div>
                </div>
                <div className="bg-dark-700 border border-dark-600 rounded p-3 mt-3">
                    <p className="font-mono text-xs text-gray-500">
                        ⚠️ Tu actividad está ligada a este dispositivo y navegador. Si limpias el almacenamiento local o cambias de dispositivo, perderás acceso a este historial.
                    </p>
                </div>
            </div>

            {/* Posts */}
            <h2 className="font-mono text-sm text-gray-400 uppercase tracking-wider mb-3">
                posts — {data?.posts.length || 0}
            </h2>

            {data?.posts.length === 0 ? (
                <p className="font-mono text-sm text-gray-600 mb-6">no has publicado nada todavía.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {data?.posts.map((post) => (
                        <div key={post.id} className="bg-dark-800 border border-dark-600 rounded-lg overflow-hidden hover:border-neon-blue/30 transition-all">
                            {post.image_url && (
                                <img src={post.image_url} alt="" className="w-full h-48 object-cover border-b border-dark-600" />
                            )}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Badge variant="blue">/{post.board_slug}/</Badge>
                                    <span className="font-mono text-xs text-gray-600">
                                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                                    </span>
                                </div>
                                <Link to={`/post/${post.id}`}>
                                    <h3 className="font-mono text-sm text-gray-200 hover:text-neon-blue transition-colors">
                                        {post.title}
                                    </h3>
                                </Link>
                                {post.content && (
                                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{post.content}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2 font-mono text-xs text-gray-600">
                                    <span className="flex items-center gap-1 text-neon-blue"><ArrowUp size={12} />{post.upvotes || 0}</span>
                                    <span className="flex items-center gap-1 text-neon-magenta"><ArrowDown size={12} />{post.downvotes || 0}</span>
                                    <span className="flex items-center gap-1"><MessageSquare size={12} />{post.comment_count}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Comentarios */}
            <h2 className="font-mono text-sm text-gray-400 uppercase tracking-wider mb-3">
                comentarios recientes — {data?.comments.length || 0}
            </h2>
            {data?.comments.length === 0 ? (
                <p className="font-mono text-sm text-gray-600">no has comentado nada todavía.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {data?.comments.map((comment) => (
                        <div key={comment.id} className="bg-dark-800 border border-dark-600 rounded-lg p-3">
                            <p className="text-gray-300 text-sm mb-1 line-clamp-2">{comment.content}</p>
                            <Link to={`/post/${comment.post_id}`} className="font-mono text-xs text-gray-600 hover:text-neon-blue transition-colors">
                                en: {comment.post_title}
                            </Link>
                            <span className="font-mono text-xs text-gray-700 ml-2">
                                · {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnonProfile;