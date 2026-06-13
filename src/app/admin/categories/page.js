'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services';
import { Card, Button, Input } from '@/components/common';
import { FaPlus, FaEdit, FaTrash, FaImage } from 'react-icons/fa';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    parentId: '',
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchCategories();
    }
  }, [isAuthenticated, user]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/categories?all=true');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const categoryData = {
        name: formData.name,
        description: formData.description,
        image: formData.image || null,
        parentId: formData.parentId || null,
      };

      if (editingCategory) {
        // Update existing category
        await api.put('/api/categories', { ...categoryData, id: editingCategory.id });
        alert('Category updated successfully!');
      } else {
        // Create new category
        await api.post('/api/categories', categoryData);
        alert('Category created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.data?.error || error.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await api.delete(`/api/categories?id=${categoryId}`);
      alert('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.data?.error || error.message || 'Failed to delete category');
    }
  };


  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      parentId: '',
    });
    setEditingCategory(null);
    setImagePreview(null);
  };

  const [imagePreview, setImagePreview] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview first
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.url) {
        setFormData(prev => ({ ...prev, image: result.url }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try URL instead.');
    }
  };


  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        parentId: category.parentId || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
            <p className="text-gray-600 mt-2">Create and manage product categories</p>
          </div>
          <Button onClick={() => openModal()}>
            <FaPlus className="mr-2" />
            Add Category
          </Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subcategories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories
                  .filter(category => !category.parentId) // Only top-level categories
                  .map((category) => (
                    <React.Fragment key={category.id}>
                      {/* Parent Category Row */}
                      <tr className="hover:bg-gray-50 bg-white">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                              {category.image ? (
                                <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <FaImage className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{category.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {category.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          Top Level
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {category.children?.length || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(category)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Subcategory Rows */}
                      {category.children?.map((child) => (
                        <tr key={child.id} className="hover:bg-gray-50 bg-gray-25">
                          <td className="px-6 py-3 pl-12">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0 bg-gray-300 rounded-lg overflow-hidden">
                                {child.image ? (
                                  <img src={child.image} alt={child.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <FaImage className="text-gray-500 text-xs" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-700">— {child.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {child.description || '-'}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {category.name}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            —
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openModal(child)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(child.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter category name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter category description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Image
                    </label>
                    <div className="space-y-3">
                      {/* File Upload */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {/* URL Input */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          or Image URL
                        </label>
                        <Input
                          name="image"
                          value={formData.image}
                          onChange={handleChange}
                          placeholder="https://example.com/image.jpg"
                          size="sm"
                        />
                      </div>
                      {/* Preview */}
                      {formData.image && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <img 
                            src={formData.image}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-lg border"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium">Preview</p>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, image: '' }));
                              }}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Category
                    </label>
                    <select
                      name="parentId"
                      value={formData.parentId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Top Level Category</option>
                      {categories
                        .filter(c => c.id !== editingCategory?.id)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
