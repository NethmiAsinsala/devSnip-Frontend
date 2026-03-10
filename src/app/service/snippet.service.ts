import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SnippetService {

  private api = "http://localhost:8080/api/snippets";

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ✅ fixed URL to match backend
  // Temporarily added ?id= as a query parameter because backend controller is missing @PathVariable
  getSnippetsByFolder(folderId: number) {
    return this.http.get<any[]>(`${this.api}/get-by-folder/${folderId}?id=${folderId}`, {
      headers: this.getHeaders()
    });
  }

  getAllSnippets() {
    return this.http.get<any[]>(`${this.api}/get-all`, {
      headers: this.getHeaders()
    });
  }

  addSnippet(snippet: any) {
    return this.http.post(`${this.api}/add`, snippet, {
      headers: this.getHeaders()
    });
  }

  updateSnippet(id: number, snippet: any) {
    return this.http.patch(`${this.api}/update/${id}`, snippet, {
      headers: this.getHeaders()
    });
  }

  deleteSnippet(id: number) {
    return this.http.delete(`${this.api}/delete/${id}`, {
      headers: this.getHeaders()
    });
  }

  explainSnippet(codeContent: string) {
    return this.http.post(`${this.api}/explain`, { code_content: codeContent }, {
      headers: this.getHeaders(),
      responseType: 'text' // Spring Boot returns a plain string, not JSON
    });
  }
}