import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { getUserPublicProfileAction } from '@/app/actions';
import ProfileClient from './ProfileClient';

interface Props {
  params: { uid: string };
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { uid } = params;
  const result = await getUserPublicProfileAction(uid);

  if (!result.success || !result.data) {
    return {
      title: 'Bruger ikke fundet | Cohéro',
    };
  }

  const profile = result.data.profile;
  const title = `${profile.username} - Professionel Profil | Cohéro`;
  const description = `${profile.username} er en ${profile.profession} ${profile.institution ? `fra ${profile.institution}` : ''} med en streak på ${profile.dailyChallengeStreak} dage på Cohéro.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: [
        {
          url: 'https://cohero.dk/og-image-profile.png', // Fallback OG image
          width: 1200,
          height: 630,
          alt: `${profile.username} på Cohéro`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { uid } = params;
  const result = await getUserPublicProfileAction(uid);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <ProfileClient initialData={result.data} />
    </main>
  );
}
