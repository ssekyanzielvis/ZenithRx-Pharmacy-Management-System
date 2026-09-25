/**
 * healthEducationService.ts — ZenithRx Patient Health Library & CMS (§7, §29)
 * Clinical guides, chronic disease self-management, and antibiotic stewardship articles.
 */

import { HealthEducationArticle } from '../types';
export type { HealthEducationArticle };

const STORAGE_KEY_HEALTH_ARTICLES = 'zenithrx_health_articles_v1';

export const INITIAL_HEALTH_ARTICLES: HealthEducationArticle[] = [
  {
    id: 'art-001',
    slug: 'managing-hypertension-uganda-guide',
    title: 'Mastering Blood Pressure: The Practical Guide for Patients in Uganda',
    category: 'Chronic Illness',
    summary: 'Essential lifestyle adjustments, salt reduction tips, and why you must never skip your daily Amlodipine or Losartan dose.',
    contentMarkdown: `### Why Blood Pressure Control Matters
Hypertension is often called the 'silent killer' because it damages vital blood vessels in your brain, heart, and kidneys without causing obvious symptoms until a stroke or heart failure occurs.

#### Key Rules for Success:
1. **Take Your Medication Every Morning**: Pair taking your pill with a daily habit, such as morning breakfast or brushing teeth.
2. **Cut Down on Table Salt & Seasoning Cubes**: Sodium holds excess water in your bloodstream, raising arterial pressure.
3. **Drink Adequate Water**: 2 to 3 litres daily keeps kidneys functioning optimally.
4. **Regular Pharmacy Checks**: Visit your nearest ZenithRx accredited community pharmacy once a week for a free blood pressure log.`,
    readTimeMinutes: 4,
    authorName: 'Dr. Arthur Ssenabulya',
    authorTitle: 'Supervising Pharmacist (B.Pharm, MPS)',
    reviewerPharmacistName: 'Dr. Sarah Nabwire (MD, Clinical Consultant)',
    isPublished: true,
    publishedAt: '2026-07-15T10:00:00Z',
    tags: ['Hypertension', 'Cardiovascular', 'Lifestyle', 'Diet'],
    featured: true,
    relatedMedications: ['Amlodipine', 'Losartan', 'Atenolol'],
  },
  {
    id: 'art-002',
    slug: 'responsible-antibiotic-use-amoxicillin',
    title: 'Antibiotic Stewardship: Why You Must Finish Your Full Prescription',
    category: 'Antibiotic Stewardship',
    summary: 'Stopping antibiotics early creates superbug resistance. Learn how Co-Amoxiclav works and why leftover capsules should never be shared.',
    contentMarkdown: `### The Global Threat of Antimicrobial Resistance (AMR)
When you take an antibiotic for only 3 days instead of the prescribed 7 days, the weakest bacteria die first, leaving behind the strongest mutant bacteria to multiply and become immune to common antibiotics.

#### Critical Patient Guidance:
- **Never save leftover antibiotics** for the next time you get a cold.
- **Common colds and flu are caused by viruses**, against which antibiotics have zero effect.
- Always consult a registered pharmacist before purchasing any antimicrobial medication.`,
    readTimeMinutes: 3,
    authorName: 'Sarah Namubiru',
    authorTitle: 'Lead Clinical Technician',
    isPublished: true,
    publishedAt: '2026-08-01T08:00:00Z',
    tags: ['Antibiotics', 'AMR', 'Prescriptions', 'Safety'],
    featured: true,
    relatedMedications: ['Augmentin', 'Amoxicillin', 'Azithromycin', 'Ciprofloxacin'],
  },
  {
    id: 'art-003',
    slug: 'diabetes-type-2-diet-blood-sugar',
    title: 'Living Well with Type 2 Diabetes: Diet, Metformin & Blood Glucose',
    category: 'Chronic Illness',
    summary: 'How to manage carbohydrate portions with local Ugandan foods (matooke, posho, cassava) while maintaining healthy HbA1c levels.',
    contentMarkdown: `### Balancing Local Diets with Glycemic Control
Local staples like matooke, sweet potatoes, and posho are rich in carbohydrates. Understanding portion control is key to keeping your morning fasting blood sugar below 7.0 mmol/L.

#### The Plate Method:
- **1/2 of your plate**: Non-starchy vegetables (nakati, dodo, sukuma wiki, cabbage, cucumber)
- **1/4 of your plate**: Lean proteins (fish, chicken, beans, peas)
- **1/4 of your plate**: Complex carbohydrates (steamed matooke or brown rice)`,
    readTimeMinutes: 5,
    authorName: 'Dr. Arthur Ssenabulya',
    authorTitle: 'Supervising Pharmacist',
    isPublished: true,
    publishedAt: '2026-07-28T14:00:00Z',
    tags: ['Diabetes', 'Metformin', 'Nutrition', 'HbA1c'],
    featured: false,
    relatedMedications: ['Metformin', 'Glucophage', 'Glibenclamide', 'Insulin Glargine'],
  }
];

export const getHealthEducationArticles = (onlyPublished = true): HealthEducationArticle[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HEALTH_ARTICLES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_HEALTH_ARTICLES, JSON.stringify(INITIAL_HEALTH_ARTICLES));
      return onlyPublished ? INITIAL_HEALTH_ARTICLES.filter(a => a.isPublished) : INITIAL_HEALTH_ARTICLES;
    }
    const all: HealthEducationArticle[] = JSON.parse(raw);
    return onlyPublished ? all.filter(a => a.isPublished) : all;
  } catch {
    return INITIAL_HEALTH_ARTICLES;
  }
};

export const saveHealthEducationArticle = (article: Omit<HealthEducationArticle, 'id' | 'slug' | 'publishedAt'>): HealthEducationArticle => {
  const all = getHealthEducationArticles(false);
  const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newArticle: HealthEducationArticle = {
    ...article,
    id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    slug,
    publishedAt: new Date().toISOString(),
  };

  const updated = [newArticle, ...all];
  try {
    localStorage.setItem(STORAGE_KEY_HEALTH_ARTICLES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save article', e);
  }
  return newArticle;
};
