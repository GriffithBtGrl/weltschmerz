import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import usePostStore from '../store/postStore';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import { uploadApi } from '../services/api';
import toast from 'react-hot-toast';
import { ImagePlus, X } from 'lucide-react';

const BOARDS = ['random','anime', 'tech', 'gaming', 'music', 'memes', 'feels', 'art'];

const CreatePost = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { createPost } = usePostStore();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const onSubmit = async (data) => {
    try {
      let image_url = null;
      let image_public_id = null;

      if (imageFile) {
        setUploading(true);
        const { data: uploadData } = await uploadApi.upload(imageFile);
        image_url = uploadData.url;
        image_public_id = uploadData.public_id;
        setUploading(false);
      }

      const post = await createPost({ ...data, image_url, image_public_id });
      toast.success('Post creado');
      navigate(`/post/${post.id}`);
    } catch (err) {
      setUploading(false);
      toast.error(err.response?.data?.error || 'Error al crear post');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-mono text-xl text-gray-200 mb-6">
        <span className="text-neon-blue">&gt;</span> nuevo post
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Board */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Board</label>
          <select
            {...register('board_slug', { required: 'Selecciona un board' })}
            className="bg-dark-950 border border-dark-600 text-gray-200 rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/30"
          >
            <option value="">seleccionar board...</option>
            {BOARDS.map((b) => (
              <option key={b} value={b}>/{b}/</option>
            ))}
          </select>
          {errors.board_slug && (
            <span className="text-xs text-red-400 font-mono">{errors.board_slug.message}</span>
          )}
        </div>

        <Input
          label="Título"
          placeholder="¿De qué se trata?"
          error={errors.title?.message}
          {...register('title', {
            required: 'El título es requerido',
            maxLength: { value: 200, message: 'Máximo 200 caracteres' }
          })}
        />

        <Textarea
          label="Contenido"
          placeholder="Escribe algo... o no. Las imágenes también cuentan."
          rows={5}
          error={errors.content?.message}
          {...register('content')}
        />

        {/* Imagen */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            Imagen (opcional)
          </label>

          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="preview"
                className="rounded border border-dark-600 max-h-48 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-dark-900/80 text-gray-400 hover:text-red-400 rounded-full p-1 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-dark-600 rounded cursor-pointer hover:border-neon-blue/50 transition-colors">
              <ImagePlus size={16} className="text-gray-600" />
              <span className="font-mono text-sm text-gray-600">subir imagen</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            cancelar
          </Button>
          <Button type="submit" variant="magenta" loading={isSubmitting || uploading}>
            {uploading ? 'subiendo imagen...' : 'publicar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;