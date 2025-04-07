'use client';

import { useState } from 'react';
import { UserBook, BookStatus } from '@/types/userBook';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserBooksStore } from '@/store/userBooksStore';

interface BookDetailsModalProps {
  book: UserBook;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookDetailsModal({ book, isOpen, onClose }: BookDetailsModalProps) {
  const _ = useTranslation();
  const { updateBook } = useUserBooksStore();
  const [currentStatus, setCurrentStatus] = useState<BookStatus | undefined>(book.status);
  const [currentRating, setCurrentRating] = useState<number | undefined>(book.rating);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const statusOptions: { value: BookStatus; label: string }[] = [
    { value: 'want_to_read', label: _('Want to Read') },
    { value: 'reading', label: _('Currently Reading') },
    { value: 'read', label: _('Read') },
    { value: 'dnf', label: _('Did Not Finish') },
  ];

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as BookStatus || undefined;
    setCurrentStatus(newStatus);
    await saveChanges(newStatus, currentRating);
  };

  const handleRatingChange = async (newRating: number) => {
    const updatedRating = newRating === currentRating ? undefined : newRating;
    setCurrentRating(updatedRating);
    await saveChanges(currentStatus, updatedRating);
  };

  const saveChanges = async (status: BookStatus | undefined, rating: number | undefined) => {
    setIsSaving(true);
    try {
      await updateBook({
        id: book.id,
        status,
        rating,
      });
    } catch (error) {
      console.error('Error updating book:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl max-h-[90vh] bg-base-100 rounded-lg flex flex-col">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h2 className="text-xl font-bold">{_('Book Details')}</h2>
          <button className="btn btn-sm btn-circle" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 w-full md:w-1/3 flex justify-center md:block">
              {book.thumbnail_url ? (
                <img
                  src={book.thumbnail_url}
                  alt={book.title}
                  className="max-h-[40vh] md:max-h-[60vh] w-auto md:w-full md:object-cover object-contain shadow-lg rounded"
                />
              ) : (
                <div className="w-full max-h-[40vh] md:max-h-[60vh] aspect-[2/3] bg-base-300 flex items-center justify-center rounded shadow-lg">
                  <span className="text-lg font-medium p-4 text-center">{book.title}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
              <p className="text-base-content/70 mb-4">
                {book.authors?.join(', ') || _('Unknown author')}
              </p>
              
              {book.description && (
                <div className="mb-4">
                  <p className="text-sm">{book.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                {book.published_date && (
                  <div>
                    <span className="text-xs text-base-content/50">{_('Published')}</span>
                    <p className="text-sm">{book.published_date}</p>
                  </div>
                )}
                
                {book.page_count && (
                  <div>
                    <span className="text-xs text-base-content/50">{_('Pages')}</span>
                    <p className="text-sm">{book.page_count}</p>
                  </div>
                )}
                
                {book.isbn && (
                  <div>
                    <span className="text-xs text-base-content/50">ISBN</span>
                    <p className="text-sm">{book.isbn}</p>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <span className="text-xs text-base-content/50">{_('Reading Status')}</span>
                <div className="relative">
                  <select
                    className="select select-bordered w-full max-w-xs mt-1"
                    value={currentStatus || ''}
                    onChange={handleStatusChange}
                    disabled={isSaving}
                  >
                    <option value="">{_('-- Select Status --')}</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {isSaving && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-xs"></span>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-xs text-base-content/50">{_('Your Rating')}</span>
                <div className="flex items-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`text-2xl focus:outline-none ${star <= (currentRating || 0) ? 'text-yellow-500' : 'text-gray-400'}`}
                      onClick={() => handleRatingChange(star)}
                      disabled={isSaving}
                    >
                      ★
                    </button>
                  ))}
                  {isSaving && (
                    <span className="ml-2 loading loading-spinner loading-xs"></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-base-300 flex justify-end">
          <button 
            className="btn btn-outline btn-error"
            // For now, this button doesn't do anything
          >
            {_('Remove from Library')}
          </button>
        </div>
      </div>
    </div>
  );
} 