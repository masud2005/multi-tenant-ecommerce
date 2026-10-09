'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { cn } from '@/lib/utils';

export interface FaqItemData {
  id: string;
  category: string;
  q: string;
  a: string;
}

export interface FaqEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  items: FaqItemData[];
  onSave: (data: {
    title: string;
    categories: string[];
    items: FaqItemData[];
    visibility: string;
    publishAt?: string;
  }) => void;
  initialTitle?: string;
}

export function FaqEditorDrawer({
  open,
  onClose,
  categories: initialCategories,
  items: initialItems,
  onSave,
  initialTitle = 'Help & FAQ',
}: FaqEditorDrawerProps) {
  const [title, setTitle] = useState(initialTitle);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [activeCategory, setActiveCategory] = useState<string>('Orders');
  const [items, setItems] = useState<FaqItemData[]>(initialItems);
  const [visibility, setVisibility] = useState('Publish now');
  const [publishAt, setPublishAt] = useState('2026-10-01T09:00');

  // Collapse state for each FAQ item (id -> boolean)
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});

  // New category creation modal / input state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Sync initial props whenever drawer opens
  useEffect(() => {
    if (open) {
      setTitle(initialTitle || 'Help & FAQ');
      // Filter out Payments if present in initialCategories
      const filteredCats = (initialCategories.length > 0
        ? initialCategories
        : ['Orders', 'Delivery', 'Returns', 'Account']
      ).filter((c) => c.toLowerCase() !== 'payments');

      const cats = filteredCats.length > 0 ? filteredCats : ['Orders', 'Delivery', 'Returns', 'Account'];
      setCategories(cats);
      setActiveCategory(cats[0] || 'Orders');

      const filteredItems = (initialItems.length > 0 ? initialItems : [])
        .filter((it) => it.category.toLowerCase() !== 'payments')
        .map((it, idx) => ({
          ...it,
          id: it.id || `faq-${idx}-${Date.now()}`,
        }));

      setItems(
        filteredItems.length > 0
          ? filteredItems
          : [
              {
                id: `faq-1`,
                category: 'Orders',
                q: 'How can I track my order?',
                a: 'Use the Track order page with your order number and phone number, or see live status in My Account -> Orders. You will also receive SMS updates at every step.',
              },
            ]
      );
      setVisibility('Publish now');
      setCollapsedItems({});
      setIsCreatingCategory(false);
      setNewCategoryName('');
    }
  }, [open, initialCategories, initialItems, initialTitle]);

  // Handle Add Category
  const handleCreateCategorySubmit = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setIsCreatingCategory(false);
      return;
    }
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('This category already exists');
      setActiveCategory(categories.find((c) => c.toLowerCase() === trimmed.toLowerCase()) || trimmed);
      setIsCreatingCategory(false);
      setNewCategoryName('');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    setActiveCategory(trimmed);

    // Also create a starter item for this new category
    const newItem: FaqItemData = {
      id: `faq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: trimmed,
      q: '',
      a: '',
    };
    setItems((prev) => [...prev, newItem]);

    setNewCategoryName('');
    setIsCreatingCategory(false);
    toast.success(`Category "${trimmed}" created`);
  };

  // Handle Add FAQ Item in the current active category
  const handleAddItem = () => {
    const newItem: FaqItemData = {
      id: `faq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: activeCategory || categories[0] || 'Orders',
      q: '',
      a: '',
    };
    setItems((prev) => [...prev, newItem]);
    toast.success(`New FAQ item added to ${activeCategory}`);
  };

  // Update Item field
  const handleUpdateItem = (id: string, field: 'category' | 'q' | 'a', value: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Toggle Collapse Item
  const toggleCollapse = (id: string) => {
    setCollapsedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error('You must keep at least one FAQ item');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    toast.success('FAQ item removed');
  };

  // Save
  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Please enter a page title');
      return;
    }
    const hasEmpty = items.some((it) => !it.q.trim() || !it.a.trim());
    if (hasEmpty) {
      toast.error('Please fill in all questions and answers before saving');
      return;
    }

    onSave({
      title: title.trim(),
      categories,
      items,
      visibility,
      publishAt: visibility === 'Schedule' ? publishAt : undefined,
    });

    onClose();
    toast.success(
      visibility === 'Publish now'
        ? 'FAQ page published successfully'
        : visibility === 'Schedule'
        ? `FAQ page scheduled for ${publishAt}`
        : 'FAQ page saved as draft'
    );
  };

  // Filter items for the currently active category
  const activeItems = items.filter((it) => it.category === activeCategory);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title="Create Help & FAQ Page"
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              window.open('/faq', '_blank');
              toast.success('Previewing FAQ page...');
            }}
            className="text-sm font-normal text-ink hover:underline cursor-pointer px-2 py-1"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-2xs"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-6 px-6 py-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-normal text-ink mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Help & FAQ"
            className="h-10 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-surface px-3 text-sm text-ink focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:focus:border-white dark:focus:ring-white transition-colors"
          />
        </div>

        {/* FAQ Sections & Categories Header + Tabs (Excluding Payments) */}
        <div>
          <label className="block text-sm font-normal text-ink mb-2">
            FAQ Sections & Categories
          </label>

          <div className="inline-flex flex-wrap rounded-md border border-neutral-300 dark:border-neutral-700 overflow-hidden divide-x divide-neutral-300 dark:divide-neutral-700 bg-surface">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-4 py-2 text-sm font-normal transition-colors cursor-pointer',
                    isActive
                      ? 'bg-[#ebe5dc] text-black font-medium dark:bg-neutral-800 dark:text-white'
                      : 'bg-surface text-ink hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline Category Creator popup/bar if clicked */}
        {isCreatingCategory && (
          <div className="flex items-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-surface p-3 animate-in fade-in">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateCategorySubmit();
                } else if (e.key === 'Escape') {
                  setIsCreatingCategory(false);
                  setNewCategoryName('');
                }
              }}
              autoFocus
              placeholder="Enter new category name (e.g. Shipping)..."
              className="h-9 flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="button"
              onClick={handleCreateCategorySubmit}
              className="rounded-md bg-black px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingCategory(false);
                setNewCategoryName('');
              }}
              className="rounded-md p-2 text-ink-muted hover:bg-subtle cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Active Category Cards */}
        <div className="space-y-4">
          {activeItems.length > 0 ? (
            activeItems.map((item) => {
              const isCollapsed = !!collapsedItems[item.id];

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-surface p-5 space-y-4 shadow-2xs"
                >
                  {/* Category Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">
                      Category: {item.category || activeCategory}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-ink hover:text-danger transition-colors cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCollapse(item.id)}
                        className="p-1 text-ink hover:text-ink-muted transition-colors cursor-pointer"
                        title={isCollapsed ? 'Expand' : 'Collapse'}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  {!isCollapsed && (
                    <div className="space-y-4 pt-1">
                      {/* Question */}
                      <div>
                        <label className="block text-xs font-normal text-ink mb-1.5">
                          Question
                        </label>
                        <input
                          type="text"
                          value={item.q}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'q', e.target.value)
                          }
                          placeholder="How can I track my order?"
                          className="h-10 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-surface px-3 text-sm text-ink focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:focus:border-white transition-colors"
                        />
                      </div>

                      {/* Answer */}
                      <div>
                        <label className="block text-xs font-normal text-ink mb-1.5">
                          Answer
                        </label>
                        <textarea
                          rows={3}
                          value={item.a}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'a', e.target.value)
                          }
                          placeholder="Use the Track order page with your order number and phone number, or see live status in My Account -> Orders. You will also receive SMS updates at every step."
                          className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-surface px-3 py-2 text-sm text-ink focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:focus:border-white transition-colors resize-y leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-6 text-center">
              <p className="text-sm text-ink-muted mb-2">
                No FAQ items in &ldquo;{activeCategory}&rdquo; category yet.
              </p>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-black dark:text-white underline hover:no-underline cursor-pointer"
              >
                + Add first item to {activeCategory}
              </button>
            </div>
          )}
        </div>

        {/* Buttons Row: Add FAQ Item and Create New Category */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={handleAddItem}
            className="flex-1 rounded-md bg-black py-2.5 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors cursor-pointer text-center shadow-xs"
          >
            Add FAQ Item
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingCategory(true)}
            className="rounded-md bg-black py-2.5 px-5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors cursor-pointer text-center shadow-xs"
          >
            Create New Category
          </button>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-normal text-ink mb-1.5">
            Visibility
          </label>
          <div className="relative">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="h-10 w-full appearance-none rounded-md border border-neutral-300 dark:border-neutral-700 bg-surface pl-3 pr-9 text-sm text-ink focus:border-black focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
            >
              <option value="Publish now">Publish now</option>
              <option value="Schedule">Schedule</option>
              <option value="Draft">Draft</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          </div>
          {visibility === 'Schedule' && (
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-surface px-3 text-sm text-ink"
            />
          )}
        </div>
      </div>
    </Drawer>
  );
}
