import type { FieldId } from "../../types";
import { bindingLesson } from "./binding";
import { layoutLesson } from "./layout";
import { photoLesson } from "./photo";
import { planningLesson } from "./planning";
import { prepressLesson } from "./prepress";
import { printingLesson } from "./printing";
import type { Lesson } from "./types";

export const lessons: Record<FieldId, Lesson> = {
  planning: planningLesson,
  photo: photoLesson,
  layout: layoutLesson,
  prepress: prepressLesson,
  printing: printingLesson,
  binding: bindingLesson,
};

export type { Lesson, LessonSection } from "./types";
