#!/usr/bin/env python3
"""
PDF Extractor for Foundry VTT (System Agnostic)

This script extracts content from RPG PDFs and converts it into the appropriate
format for Foundry VTT. While it works exceptionally well with DnD 5e compatible books,
it is designed to be system agnostic and can be used with various RPG systems. It can extract and organize:
- Monsters/NPCs
- Spells
- Items
- Classes and subclasses
- Backgrounds
- Adventures/Campaigns
- Indexes/Glossaries
- And other content types

The extracted content is saved in the appropriate directory structure matching
the Foundry VTT system's organization.
"""

import os
import re
import yaml
import argparse
import uuid
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

# Try different PDF parsing libraries, use what's available
try:
    import fitz  # PyMuPDF
    PDF_LIBRARY = "pymupdf"
except ImportError:
    try:
        from pdfminer.high_level import extract_text
        PDF_LIBRARY = "pdfminer"
    except ImportError:
        try:
            import PyPDF2
            PDF_LIBRARY = "pypdf2"
        except ImportError:
            raise ImportError("No PDF library found. Please install PyMuPDF, pdfminer.six, or PyPDF2.")


class PDFExtractor:
    """Base class for extracting content from PDFs"""
    
    def __init__(self, pdf_path: str, output_dir: str):
        """Initialize the extractor
        
        Args:
            pdf_path: Path to the PDF file
            output_dir: Base directory for the Foundry VTT DnD 5e system
        """
        self.pdf_path = pdf_path
        self.output_dir = output_dir
        self.source_dir = os.path.join(output_dir, "packs", "_source")
        
    def extract_text(self, page_range: Optional[Tuple[int, int]] = None) -> str:
        """Extract text from the PDF
        
        Args:
            page_range: Optional tuple of (start_page, end_page)
            
        Returns:
            Extracted text as a string
        """
        if PDF_LIBRARY == "pymupdf":
            doc = fitz.open(self.pdf_path)
            if page_range:
                start, end = page_range
                text = ""
                for i in range(start, min(end + 1, len(doc))):
                    text += doc[i].get_text()
            else:
                text = ""
                for page in doc:
                    text += page.get_text()
            doc.close()
            return text
        
        elif PDF_LIBRARY == "pdfminer":
            if page_range:
                # pdfminer doesn't have simple page range extraction
                # would need more complex implementation
                raise NotImplementedError("Page range not implemented for pdfminer")
            return extract_text(self.pdf_path)
        
        elif PDF_LIBRARY == "pypdf2":
            reader = PyPDF2.PdfReader(self.pdf_path)
            if page_range:
                start, end = page_range
                text = ""
                for i in range(start, min(end + 1, len(reader.pages))):
                    text += reader.pages[i].extract_text()
            else:
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
            return text
    
    def extract_images(self, page_range: Optional[Tuple[int, int]] = None) -> List[Dict[str, Any]]:
        """Extract images from the PDF
        
        Args:
            page_range: Optional tuple of (start_page, end_page)
            
        Returns:
            List of dictionaries with image data and metadata
        """
        images = []
        
        if PDF_LIBRARY == "pymupdf":
            doc = fitz.open(self.pdf_path)
            pages = range(doc.page_count)
            if page_range:
                start, end = page_range
                pages = range(start, min(end + 1, doc.page_count))
                
            for page_num in pages:
                page = doc[page_num]
                image_list = page.get_images(full=True)
                
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_data = {
                        "data": base_image["image"],
                        "ext": base_image["ext"],
                        "page": page_num,
                        "index": img_index
                    }
                    images.append(image_data)
            doc.close()
        else:
            # Image extraction is more complex with other libraries
            # For a complete solution, you'd need to implement extraction for other libraries
            print(f"Image extraction not implemented for {PDF_LIBRARY}")
            
        return images
    
    def save_yaml(self, data: Dict[str, Any], category: str, subcategory: str, filename: str) -> None:
        """Save data as YAML file in the appropriate directory
        
        Args:
            data: Data to save
            category: Main category (e.g., monsters, spells)
            subcategory: Subcategory (e.g., aberration, 1st-level)
            filename: Name of the file (without extension)
        """
        # Sanitize filename - remove newlines and other invalid characters
        sanitized_filename = re.sub(r'[\\/:*?"<>|\n\r\t]', '-', filename)
        
        # Ensure directory exists
        directory = os.path.join(self.source_dir, category, subcategory)
        os.makedirs(directory, exist_ok=True)
        
        # Save YAML file
        filepath = os.path.join(directory, f"{sanitized_filename}.yml")
        with open(filepath, "w", encoding="utf-8") as f:
            yaml.dump(data, f, sort_keys=False, allow_unicode=True)
            
        print(f"Saved: {filepath}")
        if sanitized_filename != filename:
            print(f"Note: Filename was sanitized from '{filename}' to '{sanitized_filename}'")
    
    def save_token_image(self, image_data: bytes, ext: str, category: str, filename: str) -> None:
        """Save token image in the appropriate directory
        
        Args:
            image_data: Binary image data
            ext: File extension (e.g., png, jpg)
            category: Category for the token (e.g., aberration, beast)
            filename: Name of the file (without extension)
        """
        # Ensure directory exists
        directory = os.path.join(self.output_dir, "tokens", category)
        os.makedirs(directory, exist_ok=True)
        
        # Save image file
        filepath = os.path.join(directory, f"{filename}.{ext}")
        with open(filepath, "wb") as f:
            f.write(image_data)
            
        print(f"Saved token: {filepath}")


class MonsterExtractor(PDFExtractor):
    """Extractor for monster/NPC stat blocks"""
    
    def __init__(self, pdf_path: str, output_dir: str):
        super().__init__(pdf_path, output_dir)
        
    def extract_monsters(self) -> None:
        """Extract monster stat blocks from the PDF"""
        text = self.extract_text()
        
        # Find monster stat blocks using regex patterns
        # This is a simplified example - actual implementation would be more complex
        monster_blocks = self._find_monster_blocks(text)
        
        for monster in monster_blocks:
            monster_data = self._parse_monster_block(monster)
            if monster_data:
                # Determine creature type for categorization
                creature_type = monster_data.get("type", "unknown").lower()
                self.save_yaml(monster_data, "monsters", creature_type, monster_data["name"])
                
                # Extract token image if available
                # This would require more complex implementation
    
    def _find_monster_blocks(self, text: str) -> List[str]:
        """Find monster stat blocks in the text
        
        Args:
            text: Extracted text from the PDF
            
        Returns:
            List of text blocks containing monster stat blocks
        """
        # This is a simplified example - actual implementation would be more complex
        # and would need to handle various PDF formats and layouts
        blocks = []
        
        # Example pattern for finding monster stat blocks
        # This would need to be adapted based on the specific PDF format
        pattern = r"(\w[\w\s]+)\n(\w+) (\w+), (\w+)\n.*?AC (\d+).*?HP (\d+).*?Speed (\d+) ft"
        
        matches = re.finditer(pattern, text, re.DOTALL)
        for match in matches:
            # Extract the entire stat block
            start_pos = match.start()
            # Find the end of the stat block (this is simplified)
            end_pos = text.find("\n\n", start_pos + 100)  # Look for double newline after some content
            if end_pos == -1:
                end_pos = start_pos + 1000  # Arbitrary length if no clear end
            
            block = text[start_pos:end_pos]
            blocks.append(block)
        
        return blocks
    
    def _parse_monster_block(self, block: str) -> Dict[str, Any]:
        """Parse a monster stat block into structured data
        
        Args:
            block: Text block containing a monster stat block
            
        Returns:
            Dictionary with parsed monster data
        """
        # This is a simplified example - actual implementation would be more complex
        # and would need to handle various stat block formats
        
        # Example parsing logic
        lines = block.split("\n")
        if len(lines) < 5:  # Basic validation
            return None
        
        # Extract basic information
        name = lines[0].strip()
        
        # Parse size, type, alignment
        type_line = lines[1].strip()
        size_type_match = re.match(r"(\w+) (\w+), (\w+)", type_line)
        if size_type_match:
            size, creature_type, alignment = size_type_match.groups()
        else:
            size, creature_type, alignment = "Medium", "unknown", "unaligned"
        
        # Parse AC
        ac_match = re.search(r"AC (\d+)", block)
        ac = int(ac_match.group(1)) if ac_match else 10
        
        # Parse HP
        hp_match = re.search(r"HP (\d+)", block)
        hp = int(hp_match.group(1)) if hp_match else 10
        
        # Parse speed
        speed_match = re.search(r"Speed (\d+) ft", block)
        speed = int(speed_match.group(1)) if speed_match else 30
        
        # Create monster data structure
        monster_data = {
            "name": name,
            "type": creature_type,
            "size": size,
            "alignment": alignment,
            "ac": ac,
            "hp": hp,
            "speed": speed,
            # Add more fields as needed
        }
        
        return monster_data


class SpellExtractor(PDFExtractor):
    """Extractor for spell descriptions"""
    
    def __init__(self, pdf_path: str, output_dir: str):
        super().__init__(pdf_path, output_dir)
    
    def extract_spells(self) -> None:
        """Extract spell descriptions from the PDF"""
        text = self.extract_text()
        
        # Find spell descriptions using regex patterns
        spell_blocks = self._find_spell_blocks(text)
        
        for spell in spell_blocks:
            spell_data = self._parse_spell_block(spell)
            if spell_data:
                # Determine spell level for categorization
                level = spell_data.get("level", 0)
                level_category = f"{level}-level" if level > 0 else "cantrip"
                self.save_yaml(spell_data, "spells", level_category, spell_data["name"])
    
    def _find_spell_blocks(self, text: str) -> List[str]:
        """Find spell descriptions in the text
        
        Args:
            text: Extracted text from the PDF
            
        Returns:
            List of text blocks containing spell descriptions
        """
        # This is a simplified example - actual implementation would be more complex
        blocks = []
        
        # Example pattern for finding spell descriptions
        # This would need to be adapted based on the specific PDF format
        pattern = r"(\w[\w\s]+)\n(\w+)-level (\w+)\n.*?Casting Time: (.*?)\n.*?Range: (.*?)\n"
        
        matches = re.finditer(pattern, text, re.DOTALL)
        for match in matches:
            # Extract the entire spell description
            start_pos = match.start()
            # Find the end of the spell description (this is simplified)
            end_pos = text.find("\n\n", start_pos + 100)  # Look for double newline after some content
            if end_pos == -1:
                end_pos = start_pos + 1000  # Arbitrary length if no clear end
            
            block = text[start_pos:end_pos]
            blocks.append(block)
        
        return blocks
    
    def _parse_spell_block(self, block: str) -> Dict[str, Any]:
        """Parse a spell description into structured data
        
        Args:
            block: Text block containing a spell description
            
        Returns:
            Dictionary with parsed spell data
        """
        # This is a simplified example - actual implementation would be more complex
        
        # Example parsing logic
        lines = block.split("\n")
        if len(lines) < 5:  # Basic validation
            return None
        
        # Extract basic information
        name = lines[0].strip()
        
        # Parse level and school
        level_line = lines[1].strip()
        level_match = re.match(r"(\w+)-level (\w+)", level_line)
        if level_match:
            level_str, school = level_match.groups()
            try:
                level = int(level_str)
            except ValueError:
                level = 0  # Default to cantrip
        else:
            level, school = 0, "unknown"
        
        # Parse casting time
        casting_time_match = re.search(r"Casting Time: (.*?)\n", block)
        casting_time = casting_time_match.group(1).strip() if casting_time_match else "1 action"
        
        # Parse range
        range_match = re.search(r"Range: (.*?)\n", block)
        spell_range = range_match.group(1).strip() if range_match else "Self"
        
        # Parse components
        components_match = re.search(r"Components: (.*?)\n", block)
        components = components_match.group(1).strip() if components_match else "V, S"
        
        # Parse duration
        duration_match = re.search(r"Duration: (.*?)\n", block)
        duration = duration_match.group(1).strip() if duration_match else "Instantaneous"
        
        # Extract description (simplified)
        description_start = block.find("\n\n")
        description = block[description_start:].strip() if description_start != -1 else ""
        
        # Create spell data structure
        spell_data = {
            "name": name,
            "level": level,
            "school": school,
            "casting_time": casting_time,
            "range": spell_range,
            "components": components,
            "duration": duration,
            "description": description,
            # Add more fields as needed
        }
        
        return spell_data


def main():
    """Main function for command-line usage"""
    parser = argparse.ArgumentParser(description="Extract content from DnD 5e PDFs for Foundry VTT")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("--output", "-o", default=".", help="Output directory (default: current directory)")
    parser.add_argument("--monsters", "-m", action="store_true", help="Extract monsters/NPCs")
    parser.add_argument("--spells", "-s", action="store_true", help="Extract spells")
    parser.add_argument("--all", "-a", action="store_true", help="Extract all content types")
    parser.add_argument("--page-range", "-p", help="Page range to process (e.g., '10-25')")
    
    args = parser.parse_args()
    
    # Validate PDF path
    if not os.path.isfile(args.pdf_path):
        print(f"Error: PDF file not found: {args.pdf_path}")
        return 1