import { Suspense, type ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import RevealSection from "@/components/motion/RevealSection";
import SectionHeader from "@/components/ui/SectionHeader";
import { listPublicCategories } from "@/lib/jobs/public-jobs";
import type { CategoryOption } from "@/types/job";
import CategoryCard from "./CategoryCard";
import { CATEGORY_GRID_COLUMNS, CategoryGrid, CategoryGridCell } from "./CategoryGrid";

const PLACEHOLDER_COUNT = CATEGORY_GRID_COLUMNS * 2;


export default function JobCategories() {
  return (
    <Suspense fallback={<CategoriesFallback />}>
      <CategoriesContent />
    </Suspense>
  );
}

async function CategoriesContent() {
  const locale = await getLocale();

  let categories: CategoryOption[] = [];
  try {
    categories = await listPublicCategories(locale);
  } catch (error) {
    console.error("Failed to list job categories:", error);
  }

  if (categories.length === 0) return null;

  return (
    <CategoriesSection>
      {categories.map((category, index) => (
        <CategoryGridCell key={category.slug} index={index}>
          <CategoryCard category={category} />
        </CategoryGridCell>
      ))}
    </CategoriesSection>
  );
}

function CategoriesFallback() {
  return (
    <CategoriesSection>
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <CategoryGridCell key={index} index={index}>
          <div
            aria-hidden="true"
            className="h-full min-h-44 animate-pulse rounded-sm-card bg-gray-3 lg:min-h-48 lg:rounded-card"
          />
        </CategoryGridCell>
      ))}
    </CategoriesSection>
  );
}

async function CategoriesSection({ children }: { children: ReactNode }) {
  const t = await getTranslations("pages.home.job_categories");
  return (
    <RevealSection id="categories" className="section-spacing">
      <div className="container-site">
        <SectionHeader
          align="center"
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />
        <CategoryGrid>{children}</CategoryGrid>
      </div>
    </RevealSection>
  );
}
