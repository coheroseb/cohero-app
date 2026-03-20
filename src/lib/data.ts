import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

export interface Content {
  id: string;
  title: string;
  description: string;
  image: ImagePlaceholder;
  author: string;
  authorImage: string;
  likes: number;
  comments: number;
  shares: number;
  category: 'Tech' | 'Art' | 'Lifestyle' | 'Travel' | 'Business' | 'Science';
}

export const contentData: Content[] = [
  {
    id: '1',
    title: 'The Future of AI',
    description: 'Exploring how AI is reshaping industries and our daily lives.',
    image: PlaceHolderImages[4],
    author: 'Jane Doe',
    authorImage: 'https://i.pravatar.cc/40?u=a042581f4e29026704d',
    likes: 152,
    comments: 34,
    shares: 12,
    category: 'Tech'
  },
  {
    id: '2',
    title: 'Minimalist Design Principles',
    description: 'A deep dive into creating more with less in design.',
    image: PlaceHolderImages[6],
    author: 'John Smith',
    authorImage: 'https://i.pravatar.cc/40?u=a042581f4e29026704e',
    likes: 230,
    comments: 55,
    shares: 25,
    category: 'Art'
  },
  {
    id: '3',
    title: 'Healthy Living in the Digital Age',
    description: 'Balancing screen time and well-being.',
    image: PlaceHolderImages[9],
    author: 'Emily White',
    authorImage: 'https://i.pravatar.cc/40?u=a042581f4e29026704f',
    likes: 480,
    comments: 120,
    shares: 88,
    category: 'Lifestyle'
  },
  {
    id: '4',
    title: 'Adventures in the Amazon',
    description: 'A travel diary from a journey through the rainforest.',
    image: PlaceHolderImages[7],
    author: 'Chris Green',
    authorImage: 'https://i.pravatar.cc/40?u=a042581f4e29026704a',
    likes: 198,
    comments: 40,
    shares: 18,
    category: 'Travel'
  },
  {
    id: '5',
    title: 'The Startup Ecosystem in 2024',
    description: 'Trends and predictions for the startup world.',
    image: PlaceHolderImages[1],
    author: 'Michael Brown',
    authorImage: 'https://i.pravatar.cc/40?u=a042581f4e29026704b',
    likes: 310,
    comments: 76,
    shares: 45,
    category: 'Business'
  },
  {
    id: '6',
    title: 'The Mysteries of the Cosmos',
    description: 'A look at the latest discoveries in space exploration.',
    image: PlaceHolderImages[0],
    author: 'Sarah Black',
    authorImage: 'https://i.pravatar.cc/40?u=a042581f4e29026704c',
    likes: 89,
    comments: 21,
    shares: 9,
    category: 'Science'
  }
];
