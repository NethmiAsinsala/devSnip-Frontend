import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class FolderService {

    private api = "http://localhost:8080/api/folder";

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getAllFolders() {
        return this.http.get<any[]>(`${this.api}/get-all`, {
            headers: this.getHeaders()
        });
    }

    createFolder(name: string) {
        // The backend expects a Map/JSON or just the folder structure. Let's send the expected DTO.
        return this.http.post(`${this.api}/add`, { name }, {
            headers: this.getHeaders()
        });
    }

    deleteFolder(id: number) {
        return this.http.delete(`${this.api}/delete/${id}`, {
            headers: this.getHeaders()
        });
    }
}
