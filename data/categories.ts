export type Category = {
  id: string;
  label: string;
  image: string;
  href: string;
};

export const defaultCategories: Category[] = [
  { id: 'shirt', label: 'پیراهن', image: '/p1.svg', href: '/search?cat=پیراهن' },
  { id: 'shawl', label: 'شال', image: '/p2.svg', href: '/search?cat=شال' },
  { id: 'coat', label: 'کت و کاپشن', image: '/p3.svg', href: '/search?cat=کت و کاپشن' },
  { id: 'skirt', label: 'دامن', image: '/p4.svg', href: '/search?cat=دامن' },
];
