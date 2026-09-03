import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '../../services/categoryService';

const BookForm = ({ initialValues = {}, onSubmit, isSubmitting = false, isEdit = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: initialValues.title || '',
    author: initialValues.author || '',
    isbn: initialValues.isbn || '',
    publisher: initialValues.publisher || '',
    publicationYear: initialValues.publicationYear || '',
    category: initialValues.category?._id || initialValues.category || '',
    totalCopies: initialValues.totalCopies !== undefined ? initialValues.totalCopies : 1,
    availableCopies: initialValues.availableCopies !== undefined ? initialValues.availableCopies : 1,
    shelfLocation: initialValues.shelfLocation || '',
    description: initialValues.description || '',
    purchasePrice: initialValues.purchasePrice !== undefined ? initialValues.purchasePrice : 0,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialValues.image || '');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        if (data.success) {
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err.message);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        title: initialValues.title || '',
        author: initialValues.author || '',
        isbn: initialValues.isbn || '',
        publisher: initialValues.publisher || '',
        publicationYear: initialValues.publicationYear || '',
        category: initialValues.category?._id || initialValues.category || '',
        totalCopies: initialValues.totalCopies !== undefined ? initialValues.totalCopies : 1,
        availableCopies: initialValues.availableCopies !== undefined ? initialValues.availableCopies : 1,
        shelfLocation: initialValues.shelfLocation || '',
        description: initialValues.description || '',
        purchasePrice: initialValues.purchasePrice !== undefined ? initialValues.purchasePrice : 0,
      });
      if (initialValues.image) {
        // Construct full URL if relative
        const imgUrl = initialValues.image.startsWith('http')
          ? initialValues.image
          : `http://localhost:5000${initialValues.image}`;
        setImagePreview(imgUrl);
      }
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Please select a valid image file (JPEG, PNG, WebP)' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image size should not exceed 5MB' }));
        return;
      }
      setErrors((prev) => ({ ...prev, image: '' }));
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author.trim()) newErrors.author = 'Author is required';
    if (!formData.isbn.trim()) newErrors.isbn = 'ISBN is required';
    if (!formData.category) newErrors.category = 'Please select a category';

    const total = parseInt(formData.totalCopies, 10);
    if (isNaN(total) || total < 0) {
      newErrors.totalCopies = 'Total copies must be 0 or greater';
    }

    if (isEdit) {
      const available = parseInt(formData.availableCopies, 10);
      if (isNaN(available) || available < 0) {
        newErrors.availableCopies = 'Available copies must be 0 or greater';
      } else if (available > total) {
        newErrors.availableCopies = 'Available copies cannot exceed total copies';
      }
    }

    if (formData.publicationYear) {
      const year = parseInt(formData.publicationYear, 10);
      const currentYear = new Date().getFullYear() + 1;
      if (isNaN(year) || year < 1000 || year > currentYear) {
        newErrors.publicationYear = `Enter a valid year between 1000 and ${currentYear}`;
      }
    }

    if (formData.purchasePrice !== undefined) {
      const price = parseFloat(formData.purchasePrice);
      if (isNaN(price) || price < 0) {
        newErrors.purchasePrice = 'Purchase price cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Use FormData for multipart file upload
    const data = new FormData();
    data.append('title', formData.title.trim());
    data.append('author', formData.author.trim());
    data.append('isbn', formData.isbn.trim());
    if (formData.publisher) data.append('publisher', formData.publisher.trim());
    if (formData.publicationYear) data.append('publicationYear', formData.publicationYear);
    data.append('category', formData.category);
    data.append('totalCopies', formData.totalCopies);
    data.append(
      'availableCopies',
      isEdit ? formData.availableCopies : formData.totalCopies
    );
    if (formData.shelfLocation) data.append('shelfLocation', formData.shelfLocation.trim());
    if (formData.description) data.append('description', formData.description.trim());
    data.append('purchasePrice', formData.purchasePrice || 0);

    if (imageFile) {
      data.append('image', imageFile);
    } else if (imagePreview === '') {
      data.append('image', '');
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="row g-3">
        {/* Cover Image Upload & Preview Section */}
        <div className="col-12 mb-2">
          <label className="form-label fw-medium d-block">
            Book Cover Image <span className="text-muted small fw-normal">(Optional)</span>
          </label>
          <div className="card bg-light border p-3">
            <div className="d-flex flex-column flex-sm-row align-items-center gap-3">
              {/* Preview Thumbnail */}
              <div
                className="bg-white border rounded d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0 shadow-sm"
                style={{ width: '100px', height: '130px' }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Book Cover Preview"
                    className="w-100 h-100 object-fit-cover"
                  />
                ) : (
                  <div className="text-center text-muted p-2 small">
                    <i className="bi bi-image fs-3 d-block"></i>
                    No Image
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex-grow-1 w-100">
                <input
                  type="file"
                  className={`form-control ${errors.image ? 'is-invalid' : ''}`}
                  id="bookImage"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />
                {errors.image && <div className="invalid-feedback d-block">{errors.image}</div>}
                <div className="text-muted small mt-1">
                  Supported formats: JPG, PNG, WebP (Max 5MB).
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger mt-2"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                  >
                    <i className="bi bi-trash me-1"></i> Remove Cover
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Book Title */}
        <div className="col-md-6">
          <label htmlFor="title" className="form-label fw-medium">
            Book Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Clean Code"
            disabled={isSubmitting}
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>

        {/* Author */}
        <div className="col-md-6">
          <label htmlFor="author" className="form-label fw-medium">
            Author <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.author ? 'is-invalid' : ''}`}
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="e.g. Robert C. Martin"
            disabled={isSubmitting}
          />
          {errors.author && <div className="invalid-feedback">{errors.author}</div>}
        </div>

        {/* ISBN */}
        <div className="col-md-4">
          <label htmlFor="isbn" className="form-label fw-medium">
            ISBN <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.isbn ? 'is-invalid' : ''}`}
            id="isbn"
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            placeholder="e.g. 978-0132350884"
            disabled={isSubmitting}
          />
          {errors.isbn && <div className="invalid-feedback">{errors.isbn}</div>}
        </div>

        {/* Category */}
        <div className="col-md-4">
          <label htmlFor="category" className="form-label fw-medium">
            Category <span className="text-danger">*</span>
          </label>
          <select
            className={`form-select ${errors.category ? 'is-invalid' : ''}`}
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={isSubmitting || loadingCategories}
          >
            <option value="">
              {loadingCategories ? 'Loading categories...' : 'Select Category'}
            </option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && <div className="invalid-feedback">{errors.category}</div>}
        </div>

        {/* Purchase Price (New Phase 5) */}
        <div className="col-md-4">
          <label htmlFor="purchasePrice" className="form-label fw-medium">
            Purchase Price (₹)
          </label>
          <div className="input-group">
            <span className="input-group-text">₹</span>
            <input
              type="number"
              className={`form-control ${errors.purchasePrice ? 'is-invalid' : ''}`}
              id="purchasePrice"
              name="purchasePrice"
              min="0"
              step="1"
              value={formData.purchasePrice}
              onChange={handleChange}
              placeholder="0"
              disabled={isSubmitting}
            />
          </div>
          {errors.purchasePrice && (
            <div className="text-danger small mt-1">{errors.purchasePrice}</div>
          )}
          <div className="form-text small">Set 0 if not available for sale (loan only).</div>
        </div>

        {/* Publisher */}
        <div className="col-md-4">
          <label htmlFor="publisher" className="form-label fw-medium">
            Publisher
          </label>
          <input
            type="text"
            className="form-control"
            id="publisher"
            name="publisher"
            value={formData.publisher}
            onChange={handleChange}
            placeholder="e.g. Prentice Hall"
            disabled={isSubmitting}
          />
        </div>

        {/* Publication Year */}
        <div className="col-md-4">
          <label htmlFor="publicationYear" className="form-label fw-medium">
            Publication Year
          </label>
          <input
            type="number"
            className={`form-control ${errors.publicationYear ? 'is-invalid' : ''}`}
            id="publicationYear"
            name="publicationYear"
            value={formData.publicationYear}
            onChange={handleChange}
            placeholder="e.g. 2024"
            disabled={isSubmitting}
          />
          {errors.publicationYear && (
            <div className="invalid-feedback">{errors.publicationYear}</div>
          )}
        </div>

        {/* Shelf Location */}
        <div className="col-md-4">
          <label htmlFor="shelfLocation" className="form-label fw-medium">
            Shelf / Rack Location
          </label>
          <input
            type="text"
            className="form-control"
            id="shelfLocation"
            name="shelfLocation"
            value={formData.shelfLocation}
            onChange={handleChange}
            placeholder="e.g. Floor 2, Shelf B-4"
            disabled={isSubmitting}
          />
        </div>

        {/* Total Copies */}
        <div className="col-md-6">
          <label htmlFor="totalCopies" className="form-label fw-medium">
            Total Copies <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            className={`form-control ${errors.totalCopies ? 'is-invalid' : ''}`}
            id="totalCopies"
            name="totalCopies"
            min="0"
            value={formData.totalCopies}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.totalCopies && (
            <div className="invalid-feedback">{errors.totalCopies}</div>
          )}
        </div>

        {/* Available Copies (Only in Edit mode) */}
        {isEdit && (
          <div className="col-md-6">
            <label htmlFor="availableCopies" className="form-label fw-medium">
              Available Copies <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className={`form-control ${errors.availableCopies ? 'is-invalid' : ''}`}
              id="availableCopies"
              name="availableCopies"
              min="0"
              value={formData.availableCopies}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.availableCopies && (
              <div className="invalid-feedback">{errors.availableCopies}</div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="col-12">
          <label htmlFor="description" className="form-label fw-medium">
            Description
          </label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief overview of the book contents..."
            disabled={isSubmitting}
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="col-12 mt-4 d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate('/books')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary d-flex align-items-center"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
            )}
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Book' : 'Add Book'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BookForm;
