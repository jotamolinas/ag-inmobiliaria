/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SEOMetadata {
  title: string;
  description: string;
  focusKeywords: string[];
  semanticKeywords: string[];
  recommendedSlug: string;
  schemaMarkup: string;
}

export interface CopyBlock {
  tag: 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'div';
  id: string;
  label: string;
  content: string;
  seoReasoning: string;
  persuasionPrinciple: string;
}

export interface FinancingPlan {
  name: string;
  downPayment: number;
  monthlyPayment: number;
  totalPayments: number;
  hasImmediatePossession: boolean;
  requiresBank: boolean;
}

export interface LeadConfig {
  agentName: string;
  whatsappNumber: string; // Dynamic lead generation
  customTargetFee: number;
}

export interface Property {
  id: string;
  title: string;
  price: string;
  priceRaw: number;
  location: string;
  type: 'sale' | 'rent';
  category: 'house' | 'land' | 'apartment' | 'cabin' | 'duplex' | 'commercial';
  bedrooms?: number;
  bathrooms?: number;
  area: string;
  description: string;
  images: string[];
  video?: string;
  featured: boolean;
  highlightFeature?: string;
  natureScore: number; // 1-5 level of connection with nature
  amenities: string[];
  googleMapsLink?: string;
}

