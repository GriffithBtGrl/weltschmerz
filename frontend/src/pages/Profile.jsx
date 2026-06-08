import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersApi } from '../services/api';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Camera, ArrowUp, ArrowDown, MessageSquare } from 'lucide-react';
import { registerPushNotifications, unregisterPushNotifications, isPushEnabled } from '../utils/webPush';

const Profile = () => {
    const { username } = useParams();
    const { user: authUser, login } = useAuthStore();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingBio, setEditingBio] = useState(false);
    const [bio, setBio] = useState('');
    const [savingBio, setSavingBio] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);

    const isOwner = authUser?.username === username;

    useEffect(() => {
        loadProfile();
    }, [username]);

    useEffect(() => {
        isPushEnabled().then(setPushEnabled);
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const { data } = await usersApi.getProfile(username);
            setProfile(data.user);
            setPosts(data.posts);
            setBio(data.user.bio || '');
        } catch {
            toast.error('Usuario no encontrado');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBio = async () => {
        setSavingBio(true);
        try {
            const { data } = await usersApi.updateBio(bio);
            setProfile({ ...profile, bio: data.bio });
            setEditingBio(false);
            toast.success('Bio actualizada');
        } catch {
            toast.error('Error al guardar bio');
        } finally {
            setSavingBio(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const { data } = await usersApi.updateAvatar(file);
            setProfile({ ...profile, avatar_url: data.avatar_url });
            // Actualizar store
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            const updated = { ...stored, avatar_url: data.avatar_url };
            localStorage.setItem('user', JSON.stringify(updated));
            toast.success('Foto actualizada');
        } catch {
            toast.error('Error al subir foto');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleTogglePush = async () => {
        if (pushEnabled) {
            await unregisterPushNotifications();
            setPushEnabled(false);
            toast.success('Notificaciones desactivadas');
        } else {
            const success = await registerPushNotifications();
            setPushEnabled(success);
            if (success) toast.success('Notificaciones activadas');
            else toast.error('No se pudieron activar las notificaciones');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <span className="font-mono text-gray-600 animate-pulse">cargando perfil...</span>
        </div>
    );

    if (!profile) return (
        <div className="text-center py-20">
            <p className="font-mono text-gray-600">usuario no encontrado.</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Header perfil */}
            <div className="bg-dark-800 border border-dark-600 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4 mb-2">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-full border-2 border-neon-blue/50 overflow-hidden bg-dark-700">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-mono text-2xl text-neon-blue">
                                    {profile.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        {isOwner && (
                            <label className="absolute -bottom-1 -right-1 bg-dark-800 border border-dark-600 rounded-full p-1 cursor-pointer hover:border-neon-blue transition-colors">
                                <Camera size={12} className="text-gray-400" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </label>
                        )}
                        {uploadingAvatar && (
                            <div className="absolute inset-0 rounded-full bg-dark-900/80 flex items-center justify-center">
                                <span className="w-4 h-4 border border-neon-blue border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="font-mono text-lg text-gray-100">{profile.username}</h1>
                            {profile.role === 'admin' && <Badge variant="magenta">admin</Badge>}
                        </div>
                        <p className="font-mono text-xs text-gray-600 mb-3">
                            miembro desde {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: es })}
                        </p>

                        {/* Bio */}
                        {editingBio ? (
                            <div className="flex flex-col gap-2">
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    maxLength={200}
                                    placeholder="Cuéntanos algo sobre ti..."
                                    className="bg-dark-950 border border-dark-600 text-gray-200 rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-neon-blue resize-none w-full"
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" variant="primary" loading={savingBio} onClick={handleSaveBio}>
                                        guardar
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingBio(false)}>
                                        cancelar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-400 text-sm">
                                    {profile.bio || (isOwner ? 'Sin bio todavía.' : 'Este usuario no tiene bio.')}
                                </p>
                                {isOwner && (
                                    <button
                                        onClick={() => setEditingBio(true)}
                                        className="font-mono text-xs text-gray-600 hover:text-neon-blue transition-colors mt-1"
                                    >
                                        {profile.bio ? 'editar bio' : '+ agregar bio'}
                                    </button>
                                )}

                                {isOwner && (
                                    <button
                                        onClick={handleTogglePush}
                                        className={`mt-3 flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded border transition-all ${pushEnabled
                                                ? 'border-neon-blue text-neon-blue bg-neon-blue/10'
                                                : 'border-dark-600 text-gray-500 hover:border-neon-blue hover:text-neon-blue'
                                            }`}
                                    >
                                        🔔 {pushEnabled ? 'notificaciones activadas' : 'activar notificaciones'}
                                    </button>
                                )}
                            </div>

                        )}

                    </div>
                </div>
            </div>

            {/* Posts del usuario */}
            <h2 className="font-mono text-sm text-gray-400 uppercase tracking-wider mb-3">
                posts — {posts.length}
            </h2>

            {posts.length === 0 ? (
                <p className="font-mono text-sm text-gray-600">no hay posts todavía.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {posts.map((post) => (
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
        </div>
    );
};

export default Profile;