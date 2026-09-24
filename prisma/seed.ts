import {
  Difficulty,
  GroceryCategory,
  MealType,
  PrismaClient,
  RecipeStatus,
  Role,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const dietaryTags = ["vegetarian", "vegan", "pescatarian", "gluten-free", "dairy-free", "nut-free", "high-protein"];
const allergyTags = ["nuts", "dairy", "gluten", "eggs", "shellfish", "soy"];

type RecipeSeed = {
  title: string;
  slug: string;
  summary: string;
  cuisine: string;
  mealType: MealType;
  difficulty: Difficulty;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Array<{ name: string; qty: number; unit: string; category: GroceryCategory }>;
  steps: string[];
  dietary: string[];
  allergens: string[];
};

const makeRecipe = (index: number, mealType: MealType, title: string, cuisine: string, dietary: string[]): RecipeSeed => ({
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  summary: `Original ${cuisine} ${mealType.toLowerCase()} idea built for busy households.`,
  cuisine,
  mealType,
  difficulty: index % 3 === 0 ? Difficulty.MEDIUM : Difficulty.EASY,
  prepMinutes: 10 + (index % 4) * 5,
  cookMinutes: 10 + (index % 5) * 6,
  servings: 4,
  calories: 360 + index * 6,
  protein: 18 + (index % 8),
  carbs: 30 + (index % 10),
  fat: 12 + (index % 6),
  ingredients: [
    { name: `${cuisine} spice blend`, qty: 1, unit: "tbsp", category: GroceryCategory.PANTRY },
    { name: "olive oil", qty: 1, unit: "tbsp", category: GroceryCategory.PANTRY },
    { name: "garlic", qty: 2, unit: "cloves", category: GroceryCategory.PRODUCE },
    { name: mealType === MealType.BREAKFAST ? "rolled oats" : "brown rice", qty: 1, unit: "cup", category: GroceryCategory.PANTRY },
    { name: mealType === MealType.DINNER ? "mixed vegetables" : "spinach", qty: 2, unit: "cups", category: GroceryCategory.PRODUCE },
  ],
  steps: [
    "Prep produce and preheat cookware.",
    "Cook aromatics with olive oil and seasoning.",
    "Add main ingredients and simmer until tender.",
    "Taste, adjust seasoning, and serve warm.",
  ],
  dietary,
  allergens: dietary.includes("nut-free") ? [] : ["nuts"],
});

const breakfasts = [
  "Sunrise Apple Cinnamon Oat Bowl",
  "Herbed Egg and Tomato Toast",
  "Golden Mango Chia Parfait",
  "Savory Spinach Polenta Cups",
  "Berry Almond Quinoa Breakfast",
];

const lunches = [
  "Roasted Pepper Chickpea Wraps",
  "Zesty Citrus Grain Salad",
  "Creamy Dill Tuna Pita",
  "Smoky Lentil Stuffed Sweet Potatoes",
  "Garden Crunch Noodle Bowl",
  "Avocado Lime Bean Tacos",
  "Sesame Ginger Chicken Rice Bowl",
  "Mediterranean Farro Lunch Jar",
  "Tomato Basil Turkey Flatbread",
  "Toasted Veggie Hummus Melt",
];

const dinners = [
  "Coconut Curry Vegetable Skillet",
  "Garlic Herb Salmon Tray Bake",
  "Warm Paprika Chicken Stew",
  "Mushroom Thyme Pasta Toss",
  "Ginger Scallion Beef Stir-Fry",
  "Maple Mustard Tofu Sheet Pan",
  "Lemon Orzo Shrimp Pot",
  "Stuffed Bell Pepper Bake",
  "Roasted Cauliflower Bean Tagine",
  "Skillet Pesto Turkey Meatballs",
  "Southwest Black Bean Enchilada Pan",
  "Crispy Chickpea Couscous Bowls",
  "Honey Soy Veggie Noodle Stir",
  "Rustic White Bean Tomato Ragout",
  "Herbed Chicken and Barley Soup",
];

const recipes: RecipeSeed[] = [
  ...breakfasts.map((title, i) => makeRecipe(i + 1, MealType.BREAKFAST, title, "Global", ["vegetarian", "nut-free"])),
  ...lunches.map((title, i) =>
    makeRecipe(i + 6, MealType.LUNCH, title, i % 2 ? "Mediterranean" : "Latin", [i % 3 ? "dairy-free" : "gluten-free", "nut-free"])
  ),
  ...dinners.map((title, i) =>
    makeRecipe(i + 16, MealType.DINNER, title, i % 2 ? "Asian" : "Comfort", [i % 4 ? "high-protein" : "vegetarian", "nut-free"])
  ),
];

async function main() {
  for (const label of dietaryTags) {
    await prisma.dietaryTag.upsert({ where: { label }, update: {}, create: { label } });
  }

  for (const label of allergyTags) {
    await prisma.allergyTag.upsert({ where: { label }, update: {}, create: { label } });
  }

  for (const recipe of recipes) {
    const created = await prisma.recipe.upsert({
      where: { slug: recipe.slug },
      update: {
        summary: recipe.summary,
        cuisine: recipe.cuisine,
        mealType: recipe.mealType,
        difficulty: recipe.difficulty,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        totalMinutes: recipe.prepMinutes + recipe.cookMinutes,
        servings: recipe.servings,
        nutritionCalories: recipe.calories,
        nutritionProteinG: recipe.protein,
        nutritionCarbsG: recipe.carbs,
        nutritionFatG: recipe.fat,
        imageUrl: `https://picsum.photos/seed/${recipe.slug}/800/600`,
        status: RecipeStatus.PUBLISHED,
      },
      create: {
        slug: recipe.slug,
        title: recipe.title,
        summary: recipe.summary,
        cuisine: recipe.cuisine,
        mealType: recipe.mealType,
        difficulty: recipe.difficulty,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        totalMinutes: recipe.prepMinutes + recipe.cookMinutes,
        servings: recipe.servings,
        nutritionCalories: recipe.calories,
        nutritionProteinG: recipe.protein,
        nutritionCarbsG: recipe.carbs,
        nutritionFatG: recipe.fat,
        pickyEaterNote: "Serve sauce on the side for selective eaters.",
        substitutions: "Swap proteins with beans or tofu based on preference.",
        imageUrl: `https://picsum.photos/seed/${recipe.slug}/800/600`,
        imageAttribution: "Placeholder image from Picsum",
        status: RecipeStatus.PUBLISHED,
      },
    });

    await prisma.recipeIngredient.deleteMany({ where: { recipeId: created.id } });
    await prisma.recipeStep.deleteMany({ where: { recipeId: created.id } });

    for (const ingredient of recipe.ingredients) {
      const ing = await prisma.ingredient.upsert({
        where: { name: ingredient.name },
        update: { category: ingredient.category },
        create: { name: ingredient.name, category: ingredient.category },
      });
      await prisma.recipeIngredient.create({
        data: { recipeId: created.id, ingredientId: ing.id, quantity: ingredient.qty, unit: ingredient.unit },
      });
    }

    for (let i = 0; i < recipe.steps.length; i++) {
      await prisma.recipeStep.create({
        data: { recipeId: created.id, order: i + 1, instruction: recipe.steps[i] },
      });
    }

    await prisma.recipeDietaryTag.deleteMany({ where: { recipeId: created.id } });
    for (const tag of recipe.dietary) {
      const found = await prisma.dietaryTag.findUnique({ where: { label: tag } });
      if (found) {
        await prisma.recipeDietaryTag.create({ data: { recipeId: created.id, dietaryTagId: found.id } });
      }
    }

    await prisma.recipeAllergyTag.deleteMany({ where: { recipeId: created.id } });
    for (const tag of recipe.allergens) {
      const found = await prisma.allergyTag.findUnique({ where: { label: tag } });
      if (found) {
        await prisma.recipeAllergyTag.create({ data: { recipeId: created.id, allergyTagId: found.id } });
      }
    }
  }

  const adminPassword = await bcrypt.hash("ChangeMeLocal123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@hearthbyte.local" },
    update: { role: Role.ADMIN, passwordHash: adminPassword },
    create: {
      email: "admin@hearthbyte.local",
      name: "Local Admin",
      role: Role.ADMIN,
      passwordHash: adminPassword,
      preferences: {
        create: {
          householdSize: 4,
          mealsPerDay: 3,
          preferredCookingTime: 35,
          dietaryPreferences: ["nut-free"],
          allergies: ["shellfish"],
          dislikedIngredients: ["cilantro"],
          favoriteCuisines: ["Mediterranean", "Comfort"],
          groceryStores: ["Community Market"],
          leftoversEnabled: true,
        },
      },
      subscription: {
        create: {
          plan: SubscriptionPlan.PAID,
          status: SubscriptionStatus.ACTIVE,
        },
      },
    },
  });

  const recipeIds = await prisma.recipe.findMany({ where: { mealType: MealType.DINNER }, select: { id: true }, take: 20 });
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() + i * 7);
    const plan = await prisma.mealPlan.create({
      data: {
        userId: admin.id,
        name: `Sample Week ${i + 1}`,
        weekOf: weekStart,
        status: i === 0 ? "ACTIVE" : "DRAFT",
      },
    });

    for (let day = 1; day <= 5; day++) {
      const recipe = recipeIds[(i * 5 + day) % recipeIds.length];
      await prisma.mealPlanEntry.create({
        data: {
          mealPlanId: plan.id,
          recipeId: recipe.id,
          dayOfWeek: day,
          mealType: MealType.DINNER,
          servings: 4,
          orderIndex: day,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
