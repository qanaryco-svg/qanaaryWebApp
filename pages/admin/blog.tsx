import dynamic from 'next/dynamic';
import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { evaluateSeo } from '../../lib/seo';

const Editor = dynamic(() => import('react-quill'), { ssr: false });

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<
    {
      id: string;
      title: string;
      content: string;
      tags: string[];
    }[]
  >(
    [
      { id: '1', title: 'راهنمای انتخاب لباس زنانه', content: 'نکات مهم برای انتخاب لباس مناسب فصل و استایل شما.', tags: ['لباس', 'مد'] },
      { id: '2', title: 'مد روز در سال 2025', content: 'بررسی ترندهای مد و لباس زنانه در سال جاری.', tags: ['مد', 'لباس زنانه'] },
    ]
  );
  const [editingPost, setEditingPost] = useState<
    {
      id: string;
      title: string;
      content: string;
      tags: string[];
    } | null
  >(null);
  const [seoReport, setSeoReport] = useState<{ score: number; issues: string[] } | null>(null);

  const handleSave = (post: {
    id: string;
    title: string;
    content: string;
    tags: string[];
  }) => {
    if (editingPost) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
    } else {
      setPosts((prev) => [...prev, { ...post, id: String(Date.now()) }]);
    }
    setEditingPost(null);
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const onPreview = () => {
    const rep = evaluateSeo({ title: editingPost?.title || '', content: editingPost?.content || '', metaDescription: '', images: [] });
    setSeoReport(rep);
  };

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">مدیریت مطالب وبلاگ</h1>

        {editingPost ? (
          <BlogForm post={editingPost} onSave={handleSave} onCancel={() => setEditingPost(null)} />
        ) : (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
            onClick={() => setEditingPost({ id: '', title: '', content: '', tags: [] })}
          >
            افزودن مطلب جدید
          </button>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border rounded p-4">
              <h3 className="text-lg font-bold mb-2">{post.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{post.content}</p>
              <div className="text-sm text-gray-500 mb-2">برچسب‌ها: {post.tags.join(', ')}</div>
              <button
                className="px-3 py-1 bg-yellow-500 text-white rounded mr-2"
                onClick={() => setEditingPost(post)}
              >
                ویرایش
              </button>
              <button
                className="px-3 py-1 bg-red-500 text-white rounded"
                onClick={() => handleDelete(post.id)}
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function BlogForm({ post, onSave, onCancel }: { post: any; onSave: (post: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [tags, setTags] = useState(post.tags.join(', '));
  const [seoReport, setSeoReport] = useState<{ score: number; issues: string[] } | null>(null);
  const [metaDescription, setMetaDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...post, title, content, tags: tags.split(',').map((t: string) => t.trim()) });
  };

  const onPreview = () => {
    const rep = evaluateSeo({ title, content, metaDescription, images: [] });
    setSeoReport(rep);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">عنوان</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">محتوا</label>
        <Editor
          value={content}
          onChange={setContent}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">برچسب‌ها (با کاما جدا کنید)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">متا توضیحات (اختیاری)</label>
        <input
          type="text"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
          ذخیره
        </button>
        <button type="button" className="px-4 py-2 bg-gray-500 text-white rounded" onClick={onCancel}>
          انصراف
        </button>
        <button type="button" className="px-4 py-2 bg-indigo-500 text-white rounded" onClick={onPreview}>
          بررسی سئو
        </button>
      </div>

      {seoReport && (
        <div className="mt-4 p-3 border rounded">
          <div className="font-semibold">سکور سئو: {seoReport.score}%</div>
          <ul className="list-disc pl-6 mt-2 text-sm text-gray-600">
            {seoReport.issues.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}