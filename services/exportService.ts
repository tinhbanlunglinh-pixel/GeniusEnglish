import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { LessonPlan } from '../types';

export const exportLessonPlanToWord = async (lesson: LessonPlan) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Tiêu đề bài học
          new Paragraph({
            text: `LESSON PLAN: ${lesson.topic.toUpperCase()}`,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: `Level: ${lesson.level}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // 1. Vocabulary
          new Paragraph({
            text: "I. Vocabulary",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...lesson.vocabulary.map((v, i) => 
            new Paragraph({
              children: [
                new TextRun({ text: `${i + 1}. ${v.word} (${v.type})`, bold: true }),
                new TextRun({ text: ` /${v.ipa}/ : ${v.meaning}` }),
              ],
              spacing: { after: 100 },
            })
          ),

          // 2. Grammar
          new Paragraph({
            text: "II. Grammar",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Topic: ", bold: true }),
              new TextRun({ text: lesson.grammar.topic }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: lesson.grammar.explanation,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Examples:", bold: true })],
            spacing: { after: 100 },
          }),
          ...lesson.grammar.examples.map(ex => 
            new Paragraph({
              text: `• ${ex}`,
              spacing: { after: 100 },
              indent: { left: 720 }, // 0.5 inch
            })
          ),

          // 3. Practice - Multiple Choice
          new Paragraph({
            text: "III. Practice Exercises",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "Part 1: Multiple Choice",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          ...lesson.practice.multipleChoice.flatMap((q, i) => [
            new Paragraph({
              children: [new TextRun({ text: `Q${i + 1}: ${q.question}`, bold: true })],
              spacing: { before: 200, after: 100 },
            }),
            ...q.options.map((opt, j) => 
              new Paragraph({
                text: `${String.fromCharCode(65 + j)}. ${opt}`,
                indent: { left: 720 },
              })
            ),
          ]),

          // Practice - Fill Blank
          new Paragraph({
            text: "Part 2: Fill in the Blank",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...lesson.practice.fillBlank.map((q, i) => 
            new Paragraph({
              text: `Q${i + 1}: ${q.question}`,
              spacing: { after: 100 },
            })
          ),

          // Practice - Scramble
          new Paragraph({
            text: "Part 3: Unscramble the Sentences",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...lesson.practice.scramble.map((q, i) => 
            new Paragraph({
              text: `Q${i + 1}: ${q.scrambled.join(" / ")}`,
              spacing: { after: 100 },
            })
          ),
          
          // Practice - Error Identification
          new Paragraph({
            text: "Part 4: Find the Mistake",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...lesson.practice.errorIdentification.map((q, i) => 
            new Paragraph({
              text: `Q${i + 1}: ${q.sentence}`,
              spacing: { after: 100 },
            })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lesson_Plan_${lesson.topic.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
};
