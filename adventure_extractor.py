#!/usr/bin/env python3
"""
Adventure and Glossary Extractor for PDF Extractor

This module extends the PDF Extractor with functionality to extract adventure/campaign
content and glossaries/indexes from RPG PDFs. It is designed to be system agnostic
while working well with 5e compatible books.
"""

import os
import re
import uuid
from typing import Dict, List, Any, Optional, Tuple

# Import from parent module
try:
    from pdf_extractor import PDFExtractor
except ImportError:
    # When running as standalone
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from pdf_extractor import PDFExtractor


class AdventureExtractor(PDFExtractor):
    """Extractor for adventure/campaign content"""
    
    def __init__(self, pdf_path: str, output_dir: str):
        super().__init__(pdf_path, output_dir)
    
    def extract_adventure(self) -> None:
        """Extract adventure content from the PDF"""
        text = self.extract_text()
        
        # Extract adventure metadata
        metadata = self._extract_adventure_metadata(text)
        
        # Extract chapters/sections
        chapters = self._extract_chapters(text)
        
        # Extract locations
        locations = self._extract_locations(text)
        
        # Extract NPCs (that aren't full monster stat blocks)
        npcs = self._extract_npcs(text)
        
        # Extract encounters
        encounters = self._extract_encounters(text)
        
        # Extract maps
        maps = self._extract_maps()
        
        # Organize all content into a compendium structure
        adventure_data = {
            "name": metadata.get("title", "Unknown Adventure"),
            "type": "adventure",
            "_id": str(uuid.uuid4())[:16],
            "system": {
                "description": {
                    "value": metadata.get("description", ""),
                    "chat": ""
                },
                "source": {
                    "custom": "",
                    "book": metadata.get("source", "Custom"),
                    "page": "",
                    "license": ""
                },
                "chapters": chapters,
                "locations": locations,
                "npcs": npcs,
                "encounters": encounters,
                "maps": maps
            }
        }
        
        # Save the adventure data
        self.save_yaml(
            adventure_data,
            "adventures",
            "",  # No subcategory for adventures
            adventure_data["name"].lower().replace(" ", "-")
        )
        
        # Save individual chapters as journal entries
        for chapter in chapters:
            chapter_data = {
                "name": chapter["title"],
                "type": "journal",
                "_id": str(uuid.uuid4())[:16],
                "system": {
                    "content": chapter["content"],
                    "source": metadata.get("title", "Unknown Adventure")
                }
            }
            
            self.save_yaml(
                chapter_data,
                "journal",
                "adventure",
                f"{adventure_data['name'].lower().replace(' ', '-')}-{chapter['title'].lower().replace(' ', '-')}"
            )
    
    def _extract_adventure_metadata(self, text: str) -> Dict[str, str]:
        """Extract adventure metadata like title, author, level range
        
        Args:
            text: Full text from the PDF
            
        Returns:
            Dictionary with adventure metadata
        """
        # This is a simplified implementation
        metadata = {
            "title": "Unknown Adventure",
            "author": "Unknown",
            "level_range": "1-20",
            "description": "",
            "source": "Custom"
        }
        
        # Try to extract title from first page
        title_match = re.search(r"^([\w\s:]+)\n", text)
        if title_match:
            metadata["title"] = title_match.group(1).strip()
        
        # Try to extract author
        author_match = re.search(r"(?:By|Author[s]?:?)\s+([\w\s,]+)\n", text)
        if author_match:
            metadata["author"] = author_match.group(1).strip()
        
        # Try to extract level range
        level_match = re.search(r"(?:An adventure for|Character levels|Levels)\s+([\w\s-]+)\s+characters", text)
        if level_match:
            metadata["level_range"] = level_match.group(1).strip()
        
        # Try to extract description
        # Look for text after title but before table of contents
        toc_match = re.search(r"(?:Table of Contents|Contents)\n", text)
        if toc_match and title_match:
            description_text = text[title_match.end():toc_match.start()]
            # Clean up the description
            description_text = re.sub(r"By[\w\s,]+\n", "", description_text)
            description_text = description_text.strip()
            metadata["description"] = f"<p>{description_text.replace('\n\n', '</p><p>')}</p>"
        
        return metadata
    
    def _extract_chapters(self, text: str) -> List[Dict[str, str]]:
        """Extract chapters/sections from the adventure
        
        Args:
            text: Full text from the PDF
            
        Returns:
            List of dictionaries with chapter data
        """
        # This is a simplified implementation
        chapters = []
        
        # Look for chapter headings
        chapter_pattern = r"Chapter (\d+)[:\s]+(.*?)\n"
        chapter_matches = list(re.finditer(chapter_pattern, text))
        
        for i, match in enumerate(chapter_matches):
            chapter_num = match.group(1)
            chapter_title = match.group(2).strip()
            
            # Find the end of this chapter
            start_pos = match.end()
            end_pos = len(text)
            if i < len(chapter_matches) - 1:
                end_pos = chapter_matches[i+1].start()
            
            # Extract chapter content
            chapter_content = text[start_pos:end_pos].strip()
            
            # Format for HTML
            chapter_content_html = f"<h1>{chapter_title}</h1><p>{chapter_content.replace('\n\n', '</p><p>')}</p>"
            
            chapters.append({
                "number": int(chapter_num),
                "title": chapter_title,
                "content": chapter_content_html
            })
        
        return chapters
    
    def _extract_locations(self, text: str) -> List[Dict[str, Any]]:
        """Extract locations from the adventure
        
        Args:
            text: Full text from the PDF
            
        Returns:
            List of dictionaries with location data
        """
        # This is a simplified implementation
        locations = []
        
        # Look for location headings
        location_patterns = [
            r"(\d+\. [\w\s]+)\n",  # Numbered locations
            r"([\w\s]+) \(Area \d+\)\n"  # Area-based locations
        ]
        
        for pattern in location_patterns:
            location_matches = list(re.finditer(pattern, text))
            
            for i, match in enumerate(location_matches):
                location_name = match.group(1).strip()
                
                # Find the end of this location description
                start_pos = match.end()
                end_pos = len(text)
                if i < len(location_matches) - 1:
                    end_pos = location_matches[i+1].start()
                
                # Extract location description
                location_desc = text[start_pos:end_pos].strip()
                
                # Format for HTML
                location_desc_html = f"<p>{location_desc.replace('\n\n', '</p><p>')}</p>"
                
                locations.append({
                    "name": location_name,
                    "description": location_desc_html,
                    "_id": str(uuid.uuid4())[:16]
                })
        
        return locations
    
    def _extract_npcs(self, text: str) -> List[Dict[str, Any]]:
        """Extract NPCs that don't have full stat blocks
        
        Args:
            text: Full text from the PDF
            
        Returns:
            List of dictionaries with NPC data
        """
        # This is a simplified implementation
        npcs = []
        
        # Look for NPC descriptions
        npc_pattern = r"([\w\s]+) is a ([\w\s]+) who ([^.]+)"
        npc_matches = list(re.finditer(npc_pattern, text))
        
        for match in npc_matches:
            npc_name = match.group(1).strip()
            npc_type = match.group(2).strip()
            npc_desc = match.group(3).strip()
            
            # Extract more context around the NPC
            context_start = max(0, match.start() - 100)
            context_end = min(len(text), match.end() + 200)
            context = text[context_start:context_end]
            
            # Format for HTML
            npc_desc_html = f"<p><strong>{npc_name}</strong> is a {npc_type} who {npc_desc}.</p>"
            
            # Add more paragraphs from context if they seem relevant
            additional_paragraphs = re.findall(r"[^.!?]*\b{0}\b[^.!?]*[.!?]".format(npc_name), context)
            if additional_paragraphs:
                for para in additional_paragraphs:
                    if para.strip() and npc_name in para and not para.strip().startswith(npc_name):
                        npc_desc_html += f"<p>{para.strip()}</p>"
            
            npcs.append({
                "name": npc_name,
                "type": npc_type,
                "description": npc_desc_html,
                "_id": str(uuid.uuid4())[:16]
            })
        
        return npcs
    
    def _extract_encounters(self, text: str) -> List[Dict[str, Any]]:
        """Extract encounters from the adventure
        
        Args:
            text: Full text from the PDF
            
        Returns:
            List of dictionaries with encounter data
        """
        # This is a simplified implementation
        encounters = []
        
        # Look for encounter descriptions
        encounter_patterns = [
            r"Encounter: ([\w\s]+)\n",
            r"Combat Encounter: ([\w\s]+)\n",
            r"Random Encounter[s]?\n"
        ]
        
        for pattern in encounter_patterns:
            encounter_matches = list(re.finditer(pattern, text))
            
            for i, match in enumerate(encounter_matches):
                if "Random Encounter" in match.group(0):
                    encounter_name = "Random Encounters"
                else:
                    encounter_name = match.group(1).strip()
                
                # Find the end of this encounter description
                start_pos = match.end()
                end_pos = len(text)
                if i < len(encounter_matches) - 1:
                    end_pos = encounter_matches[i+1].start()
                else:
                    # Look for the next section heading
                    next_section = re.search(r"\n\n[\w\s]+\n[-=]+\n", text[start_pos:])
                    if next_section:
                        end_pos = start_pos + next_section.start()
                
                # Extract encounter description
                encounter_desc = text[start_pos:end_pos].strip()
                
                # Try to extract creatures involved
                creatures = []
                creature_matches = re.finditer(r"(\d+) ([\w\s]+)", encounter_desc)
                for c_match in creature_matches:
                    count = int(c_match.group(1))
                    creature = c_match.group(2).strip()
                    if creature.lower() not in ["feet", "ft", "miles", "hour", "hours", "minute", "minutes"]:
                        creatures.append({
                            "count": count,
                            "name": creature
                        })
                
                # Format for HTML
                encounter_desc_html = f"<p>{encounter_desc.replace('\n\n', '</p><p>')}</p>"
                
                encounters.append({
                    "name": encounter_name,
                    "description": encounter_desc_html,
                    "creatures": creatures,
                    "_id": str(uuid.uuid4())[:16]
                })
        
        return encounters
    
    def _extract_maps(self) -> List[Dict[str, Any]]:
        """Extract maps from the adventure
        
        Returns:
            List of dictionaries with map data
        """
        maps = []
        
        # Extract images that might be maps
        images = self.extract_images()
        
        for i, img in enumerate(images):
            # Simple heuristic: larger images are more likely to be maps
            # In a real implementation, you'd want more sophisticated detection
            if img.get("width", 0) > 500 and img.get("height", 0) > 500:
                map_name = f"Map {i+1}"
                
                # Save the image
                img_path = f"map_{i+1}.{img['ext']}"
                img_dir = os.path.join(self.output_dir, "assets", "maps")
                os.makedirs(img_dir, exist_ok=True)
                
                with open(os.path.join(img_dir, img_path), "wb") as f:
                    f.write(img["data"])
                
                maps.append({
                    "name": map_name,
                    "path": f"assets/maps/{img_path}",
                    "_id": str(uuid.uuid4())[:16]
                })
        
        return maps


class GlossaryExtractor(PDFExtractor):
    """Extractor for glossaries and indexes"""
    
    def __init__(self, pdf_path: str, output_dir: str):
        super().__init__(pdf_path, output_dir)
    
    def extract_glossary(self) -> None:
        """Extract glossary entries from the PDF"""
        text = self.extract_text()
        
        # Find the glossary section
        glossary_match = re.search(r"(?:Glossary|Index)\n[-=]+\n", text)
        if not glossary_match:
            print("No glossary or index found in the PDF.")
            return
        
        glossary_start = glossary_match.end()
        glossary_text = text[glossary_start:]
        
        # Extract glossary entries
        entries = self._extract_glossary_entries(glossary_text)
        
        # Create a compendium of glossary entries
        glossary_data = {
            "name": "Glossary",
            "type": "journal",
            "_id": str(uuid.uuid4())[:16],
            "system": {
                "content": self._format_glossary_html(entries)
            }
        }
        
        # Save the glossary
        self.save_yaml(
            glossary_data,
            "journal",
            "reference",
            "glossary"
        )
        
        # Also save individual entries for searchability
        for entry in entries:
            entry_data = {
                "name": entry["term"],
                "type": "journal",
                "_id": str(uuid.uuid4())[:16],
                "system": {
                    "content": f"<h2>{entry['term']}</h2><p>{entry['definition']}</p>"
                }
            }
            
            self.save_yaml(
                entry_data,
                "journal",
                "glossary",
                entry["term"].lower().replace(" ", "-")
            )
    
    def extract_index(self) -> None:
        """Extract index entries from the PDF"""
        text = self.extract_text()
        
        # Find the index section
        index_match = re.search(r"Index\n[-=]+\n", text)
        if not index_match:
            print("No index found in the PDF.")
            return
        
        index_start = index_match.end()
        index_text = text[index_start:]
        
        # Extract index entries
        entries = self._extract_index_entries(index_text)
        
        # Create a compendium of index entries
        index_data = {
            "name": "Index",
            "type": "journal",
            "_id": str(uuid.uuid4())[:16],
            "system": {
                "content": self._format_index_html(entries)
            }
        }
        
        # Save the index
        self.save_yaml(
            index_data,
            "journal",
            "reference",
            "index"
        )
    
    def _extract_glossary_entries(self, text: str) -> List[Dict[str, str]]:
        """Extract glossary entries from the text
        
        Args:
            text: Glossary section text
            
        Returns:
            List of dictionaries with term and definition
        """
        entries = []
        
        # Look for patterns like "Term: Definition" or "Term. Definition"
        entry_patterns = [
            r"([\w\s-]+):\s+([^\n]+(?:\n(?!\w+:)[^\n]+)*)",  # Term: Definition
            r"([\w\s-]+)\. ([^\n]+(?:\n(?!\w+\.)[^\n]+)*)"   # Term. Definition
        ]
        
        for pattern in entry_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                term = match.group(1).strip()
                definition = match.group(2).strip()
                
                # Skip if term is just a page number or too short
                if term.isdigit() or len(term) < 3:
                    continue
                
                entries.append({
                    "term": term,
                    "definition": definition
                })
        
        return entries
    
    def _extract_index_entries(self, text: str) -> Dict[str, List[str]]:
        """Extract index entries from the text
        
        Args:
            text: Index section text
            
        Returns:
            Dictionary with terms and page references
        """
        entries = {}
        
        # Look for patterns like "Term, 42" or "Term, 42-45"
        entry_pattern = r"([\w\s,'-]+),\s+((?:\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*))\n"
        
        matches = re.finditer(entry_pattern, text)
        for match in matches:
            term = match.group(1).strip()
            pages = match.group(2).strip()
            
            # Skip if term is too short
            if len(term) < 3:
                continue
            
            # Handle sub-entries (indented under main entries)
            if term.startswith("  ") and entries:
                # Find the last main entry
                main_terms = [t for t in entries.keys() if not t.startswith("  ")]
                if main_terms:
                    main_term = main_terms[-1]
                    sub_term = term.strip()
                    full_term = f"{main_term}: {sub_term}"
                    entries[full_term] = pages
                    continue
            
            entries[term] = pages
        
        return entries
    
    def _format_glossary_html(self, entries: List[Dict[str, str]]) -> str:
        """Format glossary entries as HTML
        
        Args:
            entries: List of glossary entries
            
        Returns:
            HTML formatted glossary
        """
        html = "<h1>Glossary</h1>\n<dl>\n"
        
        # Sort entries alphabetically
        sorted_entries = sorted(entries, key=lambda e: e["term"])
        
        for entry in sorted_entries:
            html += f"<dt><strong>{entry['term']}</strong></dt>\n"
            html += f"<dd>{entry['definition']}</dd>\n"
        
        html += "</dl>"
        return html
    
    def _format_index_html(self, entries: Dict[str, List[str]]) -> str:
        """Format index entries as HTML
        
        Args:
            entries: Dictionary of index entries
            
        Returns:
            HTML formatted index
        """
        html = "<h1>Index</h1>\n"
        
        # Group entries by first letter
        by_letter = {}
        for term, pages in entries.items():
            first_letter = term[0].upper()
            if first_letter not in by_letter:
                by_letter[first_letter] = []
            by_letter[first_letter].append((term, pages))
        
        # Sort letters
        for letter in sorted(by_letter.keys()):
            html += f"<h2>{letter}</h2>\n<ul>\n"
            
            # Sort terms within each letter
            for term, pages in sorted(by_letter[letter]):
                html += f"<li><strong>{term}</strong>: {pages}</li>\n"
            
            html += "</ul>\n"
        
        return html


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Extract adventure content and glossaries from RPG PDFs")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("--output-dir", "-o", default=".", help="Output directory")
    parser.add_argument("--content-type", "-t", choices=["adventure", "glossary", "index", "all"], 
                        default="all", help="Type of content to extract")
    
    args = parser.parse_args()
    
    if args.content_type in ["adventure", "all"]:
        print("Extracting adventure content...")
        adventure_extractor = AdventureExtractor(args.pdf_path, args.output_dir)
        adventure_extractor.extract_adventure()
    
    if args.content_type in ["glossary", "all"]:
        print("Extracting glossary...")
        glossary_extractor = GlossaryExtractor(args.pdf_path, args.output_dir)
        glossary_extractor.extract_glossary()
    
    if args.content_type in ["index", "all"]:
        print("Extracting index...")
        glossary_extractor = GlossaryExtractor(args.pdf_path, args.output_dir)
        glossary_extractor.extract_index()
    
    print("Extraction complete!")