# Issue tracker: GitHub

Issues and specs live in https://github.com/kent-4/poopable/issues.
Use the gh CLI with --repo kent-4/poopable for issue operations.

## Conventions

- Publish specs and tickets as GitHub issues.
- Read tickets with gh issue view, including body, labels, and comments.
- Use gh issue list to find relevant issues.
- Use --body-file for multiline issue bodies and comments.
- Link child tickets using GitHub sub-issues when supported.
  Otherwise, include "Part of #<parent>" in each child.
- Use native issue dependencies for blockers when supported.
  Otherwise, include "Blocked by: #<number>" in the issue body.
- Apply the label mapping in triage-labels.md.

## Pull requests as a triage surface

PRs as a request surface: no.

## Wayfinding

- Store each effort's map in an issue labelled wayfinder:map.
- Link child tickets to the map and label them wayfinder:<type>,
  where type is research, prototype, grilling, or task.
- Select open, unassigned children with no open blockers in map order.
- Claim a ticket by assigning it to the driving developer before working.
- Resolve by commenting with the answer, closing the ticket, and
  adding a gist and link to the map's Decisions-so-far.
