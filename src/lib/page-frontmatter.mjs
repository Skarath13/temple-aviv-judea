import { parseMDX } from '@tinacms/mdx';

const richTextField = { name: 'body', type: 'rich-text' };

export const normalizePageFrontmatter = (page) => {
  if (!page || typeof page !== 'object' || Array.isArray(page)) return page;

  const sections = Array.isArray(page.sections)
    ? page.sections.map((section) => {
        if (
          !section ||
          typeof section !== 'object' ||
          Array.isArray(section) ||
          typeof section.body !== 'string'
        ) {
          return section;
        }

        return {
          ...section,
          body: parseMDX(section.body, richTextField, (source) => source),
        };
      })
    : page.sections;

  return { ...page, sections };
};
