import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SnippetService } from '../../service/snippet.service';
import { FolderService } from '../../service/folder.service';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HighlightModule } from 'ngx-highlightjs';
import { FormsModule } from '@angular/forms';
import hljs from 'highlight.js';

@Component({
  selector: 'app-snippet',
  standalone: true,
  imports: [CommonModule, HighlightModule, FormsModule],
  templateUrl: './snippet.html',
  styleUrl: './snippet.css',
})
export class Snippet implements OnInit {

  private snippetService = inject(SnippetService);  // ✅ use inject()
  private route = inject(ActivatedRoute);            // ✅ use inject()
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private folderService = inject(FolderService);

  snippets: any[] = [];
  filteredSnippets: any[] = [];
  folders: any[] = [];
  folderId!: number;

  selectedSnippet: any = null;
  codeCopied = false;
  relatedSnippets: any[] = [];

  // Create & Edit State
  isCreateModalOpen = false;
  isEditMode = false;
  isDeleteModalOpen = false;
  newSnippet: any = { title: '', description: '', language: '', code_content: '', tagName: '' };

  toastMessage: string | null = null;
  searchQuery: string = '';

  isExplaining = false;
  explanationResult: string | null = null;

  private typingTimer: any;
  private readonly typingInterval = 500; // debounce for language detection

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  ngOnInit(): void {
    // ✅ respond to query param changes
    this.route.queryParamMap.subscribe(params => {
      this.folderId = Number(params.get('folderId'));
      console.log('Folder ID:', this.folderId); // check if correct
      this.loadSnippets();
    });
    this.loadFolders();
  }

  loadSnippets() {
    this.snippetService
      .getSnippetsByFolder(this.folderId)
      .subscribe({
        next: (data: any[]) => {
          this.snippets = data;
          this.filterSnippets(); // apply search immediately if present
        },
        error: (err) => {
          console.error('Failed to load snippets:', err);
        }
      });
  }

  filterSnippets(): void {
    if (!this.searchQuery.trim()) {
      this.filteredSnippets = [...this.snippets];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredSnippets = this.snippets.filter(s => {
        const titleMatch = s.title?.toLowerCase().includes(q);
        const langMatch = s.language?.toLowerCase().includes(q);
        const descMatch = s.description?.toLowerCase().includes(q);
        const tagsMatch = this.parseTags(s.tagName).some(tag => tag.toLowerCase().includes(q));

        return titleMatch || langMatch || descMatch || tagsMatch;
      });
    }
    this.cdr.detectChanges();
  }

  loadFolders(): void {
    this.folderService.getAllFolders()
      .subscribe({
        next: (data) => {
          this.folders = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load folders:', err);
        }
      });
  }

  openFolder(id: number): void {
    this.router.navigate(['/snippet'], { queryParams: { folderId: id } });
  }

  openSnippetModal(snippet: any): void {
    this.selectedSnippet = snippet;
    this.codeCopied = false;

    // Pick up to 3 other snippets from the same folder as related snippets
    this.relatedSnippets = this.snippets
      .filter(s => s.id !== snippet.id)
      .slice(0, 3);
  }

  closeModal(): void {
    this.selectedSnippet = null;
    this.codeCopied = false;
    this.explanationResult = null;
    this.isExplaining = false;
  }

  explainCode(): void {
    if (!this.selectedSnippet?.code_content) return;

    this.isExplaining = true;
    this.explanationResult = null;

    this.snippetService.explainSnippet(this.selectedSnippet.code_content).subscribe({
      next: (explanation: string) => {
        this.explanationResult = explanation;
        this.isExplaining = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Explanation request failed', err);
        this.explanationResult = "Failed to connect to local AI. Is Ollama running on port 11434 with your configured model?";
        this.isExplaining = false;
        this.cdr.detectChanges();
      }
    });
  }

  copyCode(): void {
    if (this.selectedSnippet?.code_content) {
      navigator.clipboard.writeText(this.selectedSnippet.code_content).then(() => {
        this.codeCopied = true;
        setTimeout(() => { this.codeCopied = false; }, 2000);
        this.cdr.detectChanges();
      });
    }
  }

  // Create Logic
  openCreateModal(): void {
    this.newSnippet = { title: '', description: '', language: 'javascript', code_content: '', tagName: '', folderId: this.folderId };
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  onNewCodeChange(): void {
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.detectLanguageAndTags();
    }, this.typingInterval);
  }

  detectLanguageAndTags(): void {
    if (!this.newSnippet.code_content || this.newSnippet.code_content.trim() === '') {
      return;
    }

    // Auto-detect language using highlight.js with restricted subset
    const languageSubset = ['java', 'javascript', 'typescript', 'python', 'html', 'css', 'sql', 'bash', 'json', 'yaml', 'csharp', 'cpp'];
    const result = hljs.highlightAuto(this.newSnippet.code_content, languageSubset);

    let detectedLang = result.language;

    // Highlight.js sometimes confuses Java for Typescript because of classes/methods. 
    // If it guessed TS/JS, but we see Java-specific keywords, override it.
    if (detectedLang === 'typescript' || detectedLang === 'javascript') {
      if (this.newSnippet.code_content.includes('public static void main') ||
        this.newSnippet.code_content.includes('System.out') ||
        this.newSnippet.code_content.includes('public class')) {
        detectedLang = 'java';
      }
    }

    if (detectedLang) {
      this.newSnippet.language = detectedLang;

      // Smart Sub-Tagging based on language and keywords
      const suggestedTags = new Set<string>();
      if (this.newSnippet.tagName) {
        this.parseTags(this.newSnippet.tagName).forEach((t: string) => suggestedTags.add(t));
      }
      suggestedTags.add(detectedLang); // Always add language as tag

      const codeLower = this.newSnippet.code_content.toLowerCase();

      if (detectedLang === 'java') {
        if (codeLower.includes('spring')) suggestedTags.add('spring');
        if (codeLower.includes('system.out')) suggestedTags.add('console');
        if (codeLower.includes('@restcontroller')) suggestedTags.add('api');
      } else if (result.language === 'javascript' || result.language === 'typescript') {
        if (codeLower.includes('react')) suggestedTags.add('react');
        if (codeLower.includes('console.log')) suggestedTags.add('console');
      } else if (result.language === 'html' || result.language === 'xml') {
        if (codeLower.includes('class=')) suggestedTags.add('ui');
      } else if (result.language === 'sql') {
        if (codeLower.includes('select ') || codeLower.includes('insert ')) suggestedTags.add('database');
      }

      this.newSnippet.tagName = Array.from(suggestedTags).join(', ');
      this.cdr.detectChanges();
    }
  }

  createSnippet(): void {
    if (!this.newSnippet.title || !this.newSnippet.code_content) return;

    this.newSnippet.folderId = this.folderId;

    this.snippetService.addSnippet(this.newSnippet).subscribe({
      next: () => {
        this.closeCreateModal();
        this.showToast('Snippet created successfully!');
        this.loadSnippets(); // refresh
      },
      error: (err) => {
        this.showToast('Failed to create snippet.');
        console.error("Failed to create snippet", err);
      }
    });
  }

  // Edit Logic
  toggleEditMode(): void {
    this.isEditMode = true;
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.loadSnippets();
    this.closeModal();
  }

  saveSnippet(): void {
    if (!this.selectedSnippet.title || !this.selectedSnippet.code_content) return;

    this.snippetService.updateSnippet(this.selectedSnippet.id, this.selectedSnippet).subscribe({
      next: () => {
        this.isEditMode = false;
        this.closeModal(); // Return to the snippet table
        this.showToast('Snippet updated successfully!');
        this.loadSnippets();
      },
      error: (err) => {
        this.showToast('Failed to update snippet.');
        console.error("Failed to update snippet", err);
      }
    });
  }

  // Delete Logic
  openDeleteModal(): void {
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
  }

  confirmDeleteSnippet(): void {
    if (!this.selectedSnippet) return;

    this.snippetService.deleteSnippet(this.selectedSnippet.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.closeModal();
        this.showToast('Snippet deleted successfully!');
        this.loadSnippets();
      },
      error: (err) => {
        this.closeDeleteModal();
        this.showToast('Failed to delete snippet.');
        console.error("Failed to delete snippet", err);
      }
    });
  }

  /** Returns tags as a string array regardless of backend format */
  parseTags(tags: any): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.filter(t => t && t.toString().trim());
    if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean);
    return [];
  }
}