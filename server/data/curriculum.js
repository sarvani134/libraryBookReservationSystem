import { readFileSync } from 'node:fs';

// Preserve the supplied course list, including blank categories and original PDF paths.
const courses = JSON.parse(readFileSync(new URL('./courses.json', import.meta.url), 'utf8'));
export const departments = ['CSE', 'CSE AI & ML', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil'];
export const curriculumSource = 'https://www.gvpcew.ac.in/Regulations_Syllabus.php';
export const curriculumNote =
  'Subjects and semesters follow the supplied course list. Elective semesters and Semester 8 courses were not specified. Department applicability and textbook recommendations are not specified by this list.';
const semesterLabels = [
  'I Year - I Semester',
  'I Year - II Semester',
  'II Year - I Semester',
  'II Year - II Semester',
  'III Year - I Semester',
  'III Year - II Semester',
  'IV Year - I Semester',
  'IV Year - II Semester',
];
export const subjects = courses.map((course) => ({
  code: course.course_code,
  name: course.course_title,
  semester: semesterLabels.includes(course.semester)
    ? semesterLabels.indexOf(course.semester) + 1
    : null,
  semesterLabel: course.semester,
  category: course.category,
  categoryName: course.category_name,
  filePath: course.file_path,
  topics: [],
}));
export const semesters = semesterLabels.map((label, i) => ({
  number: i + 1,
  label,
  subjects: subjects.filter((subject) => subject.semester === i + 1).map((subject) => subject.name),
}));
