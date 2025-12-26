"""
Evaluation Dataset - Collection of test prompts for model evaluation
"""

import json
from typing import List, Dict, Any
from pathlib import Path


class EvaluationDataset:
    """
    A class to manage evaluation datasets with various prompt categories.
    """
    
    def __init__(self):
        self.prompts = self._create_default_dataset()
    
    def _create_default_dataset(self) -> List[Dict[str, Any]]:
        """
        Create a comprehensive evaluation dataset with diverse prompts.
        
        Returns:
            List of prompt dictionaries with metadata
        """
        dataset = [
            # Coding Tasks
            {
                "id": "code_001",
                "category": "coding",
                "prompt": "Write a Python function to calculate the factorial of a number using recursion.",
                "expected_keywords": ["def", "factorial", "return", "if"],
                "expected_output": "A recursive Python function that calculates factorial, with a base case checking if n is 0 or 1, and a recursive case that returns n * factorial(n-1).",
                "difficulty": "easy"
            },
            {
                "id": "code_002",
                "category": "coding",
                "prompt": "Explain how to implement a binary search algorithm in Python with time complexity analysis.",
                "expected_keywords": ["binary", "search", "O(log n)", "sorted"],
                "expected_output": "Binary search works on sorted arrays by repeatedly dividing the search interval in half. It compares the middle element with the target value. If equal, return the position. If target is smaller, search the left half; if larger, search the right half. Time complexity is O(log n) because the search space halves with each iteration.",
                "difficulty": "medium"
            },
            {
                "id": "code_003",
                "category": "coding",
                "prompt": "Create a Python class for a stack data structure with push, pop, and peek methods.",
                "expected_keywords": ["class", "Stack", "push", "pop", "peek"],
                "expected_output": "A Stack class with an internal list. push(item) appends to the list, pop() removes and returns the last item (with empty check), peek() returns the last item without removing it. The class follows LIFO (Last In First Out) principle.",
                "difficulty": "easy"
            },
            
            # Mathematics
            {
                "id": "math_001",
                "category": "mathematics",
                "prompt": "Solve: If x + 5 = 12, what is x?",
                "expected_keywords": ["7", "x = 7"],
                "expected_output": "x = 7 (by subtracting 5 from both sides)",
                "difficulty": "easy"
            },
            {
                "id": "math_002",
                "category": "mathematics",
                "prompt": "Explain the Pythagorean theorem and provide an example.",
                "expected_keywords": ["a^2 + b^2 = c^2", "right triangle", "hypotenuse"],
                "expected_output": "The Pythagorean theorem states that in a right triangle, the square of the hypotenuse (c) equals the sum of squares of the other two sides: a² + b² = c². Example: If sides are 3 and 4, then 3² + 4² = 9 + 16 = 25, so the hypotenuse is √25 = 5.",
                "difficulty": "medium"
            },
            {
                "id": "math_003",
                "category": "mathematics",
                "prompt": "What is the derivative of f(x) = 3x^2 + 2x + 1?",
                "expected_keywords": ["6x + 2", "derivative"],
                "expected_output": "The derivative is f'(x) = 6x + 2. Using the power rule: the derivative of 3x² is 6x, the derivative of 2x is 2, and the derivative of the constant 1 is 0.",
                "difficulty": "medium"
            },
            
            # Reasoning & Logic
            {
                "id": "logic_001",
                "category": "reasoning",
                "prompt": "If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly?",
                "expected_keywords": ["no", "cannot", "logical", "fallacy"],
                "expected_output": "No, we cannot conclude that. This is a logical fallacy. While all roses are flowers, the statement 'some flowers fade quickly' doesn't necessarily include roses. The 'some flowers' that fade quickly might be entirely different flowers, not roses.",
                "difficulty": "medium"
            },
            {
                "id": "logic_002",
                "category": "reasoning",
                "prompt": "A farmer has 17 sheep, and all but 9 die. How many sheep are left?",
                "expected_keywords": ["9", "nine"],
                "expected_output": "9 sheep are left. 'All but 9' means all except 9 die, so 9 survive.",
                "difficulty": "easy"
            },
            {
                "id": "logic_003",
                "category": "reasoning",
                "prompt": "Explain the trolley problem and discuss its ethical implications.",
                "expected_keywords": ["ethical", "dilemma", "utilitarian", "choice"],
                "expected_output": "The trolley problem is an ethical dilemma: a runaway trolley will kill five people on the tracks. You can pull a lever to divert it to another track where it will kill one person. Should you act? It highlights the conflict between utilitarian ethics (minimize deaths) and deontological ethics (not causing harm directly). The problem explores moral responsibility and the difference between action and inaction.",
                "difficulty": "hard"
            },
            
            # Creative Writing
            {
                "id": "creative_001",
                "category": "creative",
                "prompt": "Write a short story opening about a detective who discovers their reflection has gone missing.",
                "expected_keywords": ["detective", "mirror", "reflection"],
                "expected_output": "A creative story opening that introduces a detective character facing the supernatural or mysterious event of their missing reflection in a mirror. Should establish mood, character, and intrigue. The narrative should hook the reader with this unusual premise and hint at investigation to come.",
                "difficulty": "medium"
            },
            {
                "id": "creative_002",
                "category": "creative",
                "prompt": "Write a haiku about artificial intelligence.",
                "expected_keywords": ["5-7-5", "syllable"],
                "expected_output": "A three-line poem following the 5-7-5 syllable pattern, with content related to artificial intelligence. Should capture a moment or insight about AI in a concise, poetic form. Example structure: first line (5 syllables), second line (7 syllables), third line (5 syllables).",
                "difficulty": "medium"
            },
            
            # Knowledge & Facts
            {
                "id": "knowledge_001",
                "category": "knowledge",
                "prompt": "What is photosynthesis and why is it important?",
                "expected_keywords": ["plants", "sunlight", "oxygen", "carbon dioxide"],
                "expected_output": "Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen. It's important because it produces oxygen for animals to breathe, removes CO2 from the atmosphere, and forms the base of most food chains by creating energy that sustains plant life.",
                "difficulty": "easy"
            },
            {
                "id": "knowledge_002",
                "category": "knowledge",
                "prompt": "Explain the difference between machine learning and deep learning.",
                "expected_keywords": ["neural", "network", "algorithm", "data"],
                "expected_output": "Machine learning is a broad field where algorithms learn patterns from data to make predictions. Deep learning is a subset of ML that uses artificial neural networks with multiple layers (deep networks) to learn complex patterns. Deep learning typically requires more data and computational power but can automatically learn features, while traditional ML often needs manual feature engineering.",
                "difficulty": "medium"
            },
            {
                "id": "knowledge_003",
                "category": "knowledge",
                "prompt": "What are the main causes of climate change?",
                "expected_keywords": ["greenhouse", "carbon", "emissions", "temperature"],
                "expected_output": "The main causes of climate change are greenhouse gas emissions, primarily carbon dioxide from burning fossil fuels (coal, oil, gas), deforestation which reduces CO2 absorption, industrial processes, and agriculture. These activities increase greenhouse gases in the atmosphere, trapping heat and raising global temperatures.",
                "difficulty": "medium"
            },
            
            # Language & Translation
            {
                "id": "language_001",
                "category": "language",
                "prompt": "Explain the difference between 'affect' and 'effect' with examples.",
                "expected_keywords": ["verb", "noun", "impact", "influence"],
                "expected_output": "'Affect' is usually a verb meaning to influence (e.g., 'The weather affects my mood'). 'Effect' is usually a noun meaning a result or outcome (e.g., 'The effect of the rain was flooding'). Tip: Affect = Action (both start with A), Effect = End result (both start with E).",
                "difficulty": "medium"
            },
            {
                "id": "language_002",
                "category": "language",
                "prompt": "What are the key components of a well-structured paragraph?",
                "expected_keywords": ["topic sentence", "supporting", "conclusion"],
                "expected_output": "A well-structured paragraph has: (1) A topic sentence that states the main idea, (2) Supporting sentences with evidence, examples, or explanations that develop the main idea, and (3) A concluding sentence that wraps up the point or transitions to the next paragraph. All sentences should relate to the central topic.",
                "difficulty": "easy"
            },
            
            # Common Sense
            {
                "id": "commonsense_001",
                "category": "commonsense",
                "prompt": "Why do we need to refrigerate milk?",
                "expected_keywords": ["bacteria", "spoil", "fresh", "temperature"],
                "expected_output": "We refrigerate milk to slow down bacterial growth. Bacteria multiply rapidly at room temperature, causing milk to spoil and become unsafe to drink. Cold temperatures (around 4°C or 40°F) significantly slow bacterial growth, keeping milk fresh and safe for longer periods.",
                "difficulty": "easy"
            },
            {
                "id": "commonsense_002",
                "category": "commonsense",
                "prompt": "What should you do if you smell gas in your house?",
                "expected_keywords": ["leave", "emergency", "call", "ventilate", "don't"],
                "expected_output": "If you smell gas: (1) Leave the house immediately with everyone, (2) Don't use lights, phones, or anything that could create a spark, (3) Once outside and at a safe distance, call emergency services (911) and your gas company, (4) Don't re-enter until professionals declare it safe. Gas leaks can cause explosions or poisoning.",
                "difficulty": "easy"
            },
            
            # Open-ended
            {
                "id": "openended_001",
                "category": "openended",
                "prompt": "What do you think will be the most important technological advancement in the next decade?",
                "expected_keywords": ["technology", "future", "innovation"],
                "expected_output": "A thoughtful discussion of potential major technological advancements such as AI/AGI, quantum computing, renewable energy, biotechnology, or space exploration. Should include reasoning about impact on society, feasibility, and why it would be significant. Can discuss multiple technologies but should provide substantive analysis rather than just listing items.",
                "difficulty": "hard"
            },
            {
                "id": "openended_002",
                "category": "openended",
                "prompt": "Discuss the pros and cons of remote work.",
                "expected_keywords": ["flexibility", "communication", "productivity"],
                "expected_output": "Pros of remote work include flexibility in schedule and location, no commute time/cost, better work-life balance, and ability to work in comfortable environment. Cons include reduced face-to-face collaboration, potential isolation, communication challenges, difficulty separating work and personal life, and possible distractions at home. The balance varies by individual and job type.",
                "difficulty": "medium"
            }
        ]
        
        return dataset
    
    def get_all_prompts(self) -> List[Dict[str, Any]]:
        """Get all prompts in the dataset."""
        return self.prompts
    
    def get_prompts_by_category(self, category: str) -> List[Dict[str, Any]]:
        """
        Get prompts filtered by category.
        
        Args:
            category: Category name to filter by
            
        Returns:
            List of prompts in the specified category
        """
        return [p for p in self.prompts if p["category"] == category]
    
    def get_prompts_by_difficulty(self, difficulty: str) -> List[Dict[str, Any]]:
        """
        Get prompts filtered by difficulty.
        
        Args:
            difficulty: Difficulty level (easy, medium, hard)
            
        Returns:
            List of prompts with the specified difficulty
        """
        return [p for p in self.prompts if p["difficulty"] == difficulty]
    
    def get_categories(self) -> List[str]:
        """Get all unique categories in the dataset."""
        return list(set(p["category"] for p in self.prompts))
    
    def get_prompt_by_id(self, prompt_id: str) -> Dict[str, Any]:
        """
        Get a specific prompt by ID.
        
        Args:
            prompt_id: The prompt ID
            
        Returns:
            Prompt dictionary or None if not found
        """
        for prompt in self.prompts:
            if prompt["id"] == prompt_id:
                return prompt
        return None
    
    def save_to_file(self, filepath: str):
        """
        Save dataset to a JSON file.
        
        Args:
            filepath: Path to save the dataset
        """
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.prompts, f, indent=2, ensure_ascii=False)
        print(f"Dataset saved to {filepath}")
    
    def load_from_file(self, filepath: str):
        """
        Load dataset from a JSON file.
        
        Args:
            filepath: Path to load the dataset from
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            self.prompts = json.load(f)
        print(f"Dataset loaded from {filepath}")
    
    def add_prompt(self, prompt_dict: Dict[str, Any]):
        """
        Add a new prompt to the dataset.
        
        Args:
            prompt_dict: Dictionary containing prompt information
        """
        self.prompts.append(prompt_dict)
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the dataset.
        
        Returns:
            Dictionary with dataset statistics
        """
        categories = {}
        difficulties = {}
        
        for prompt in self.prompts:
            cat = prompt["category"]
            diff = prompt["difficulty"]
            categories[cat] = categories.get(cat, 0) + 1
            difficulties[diff] = difficulties.get(diff, 0) + 1
        
        return {
            "total_prompts": len(self.prompts),
            "categories": categories,
            "difficulties": difficulties,
            "category_list": self.get_categories()
        }


if __name__ == "__main__":
    # Create and display dataset
    dataset = EvaluationDataset()
    
    print("=== Evaluation Dataset Statistics ===")
    stats = dataset.get_statistics()
    print(f"Total prompts: {stats['total_prompts']}")
    print(f"\nCategories: {', '.join(stats['category_list'])}")
    print(f"\nPrompts per category:")
    for cat, count in stats['categories'].items():
        print(f"  {cat}: {count}")
    print(f"\nPrompts per difficulty:")
    for diff, count in stats['difficulties'].items():
        print(f"  {diff}: {count}")
    
    # Save to file
    dataset.save_to_file("data/evaluation_prompts.json")
    
    # Display sample prompts
    print("\n=== Sample Prompts ===")
    for i, prompt in enumerate(dataset.get_all_prompts()[:5], 1):
        print(f"\n{i}. [{prompt['category']}] {prompt['prompt'][:80]}...")

