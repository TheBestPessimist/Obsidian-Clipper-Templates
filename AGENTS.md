# AGENT Instructions

This project exists to test my [[Obsidian Clipper Templates]] with real data from websites.  
You are allowed to change the playwright code which integrates with the [[Obsidian Clipper]] extension, tests, test resources, templates and the documentation. 
NEVER EVER create/update/delete anything from the folder `Other READONLY Sources To Aid With debugging`. YOU MUST NOT TOUCH clipper's or any other helper git repo codebase.

Helpers:  
The documentation along with bugs, decisions, gotchas of this project and others is inside `documentation`, which is a symlink to a folder inside my [[Obsidian]] notes. To read something, use the `cat` command:
```  
cat ".\documentation\guide\Developing New Templates with Filter Testing.md"  
```  

**BEFORE TRYING ANYTHING, SEARCH THROUGH THOSE `DOCUMENTATION` FOLDERS IF SOME TOPIC WAS ALREADY TOUCHED AT SOME POINT. IT MOST DEFINTELY WAS!**  
I will repeat: **SEARCH DOCUMENTATION BEFORE DOING SOMETHING!!!**

Documentation on [[Obsidian]]'s [[Markdown]] is in `Other READONLY Sources To Aid With debugging/obsidian-skills/obsidian-markdown/SKILL.md`.  
[[Obsidian Clipper]] extension source code is in `Other READONLY Sources To Aid With debugging/obsidian-clipper`.  
[[Obsidian Clipper]] extension documentation is in `Other READONLY Sources To Aid With debugging/obsidian-help/en/Obsidian Web Clipper`.  
To develop new features, we use this pattern from docs: [[Developing New Templates with Filter Testing]].  
We have tried many things to improve performance. They can be found in a short and to the point list in [[PERFORMANCE — Things we tried to make the tests faster, and their status]].
When asking to implement a new template, check how other templates are implemented. There are patterns which should be used.

Run tests with `npm run test`. Run a single test file with `npm test -- .*imdb.*`.

Note: the date in the fixture might need fixing. It is hardcoded to `1111-11-11`.
