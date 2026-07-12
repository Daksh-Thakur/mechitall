'use client';

import React from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faq: FAQItem[];
}

export default function FAQSchema({ faq }: FAQSchemaProps) {
  if (!faq || faq.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
}

export function OrganizationSchema({
  name = "MechItAll",
  url = "https://www.mechitall.com",
  logo = "https://www.mechitall.com/logo.png",
  sameAs = []
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-120-490-8800',
      contactType: 'customer service',
      email: 'mechitallsupport@gmail.com',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi']
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProductSchemaProps {
  name: string;
  image?: string;
  description: string;
  sku: string;
  price: number;
  priceCurrency?: string;
  availability?: string;
  sellerName?: string;
}

export function ProductSchema({
  name,
  image = "https://www.mechitall.com/placeholder-part.png",
  description,
  sku,
  price,
  priceCurrency = "INR",
  availability = "https://schema.org/InStock",
  sellerName = "MechItAll"
}: ProductSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image,
    description,
    sku,
    mpn: sku,
    offers: {
      '@type': 'Offer',
      url: `https://www.mechitall.com/products?sku=${sku}`,
      priceCurrency,
      price,
      itemCondition: 'https://schema.org/NewCondition',
      availability,
      seller: {
        '@type': 'Organization',
        name: sellerName
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
