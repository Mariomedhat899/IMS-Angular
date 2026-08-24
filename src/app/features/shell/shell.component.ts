import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DashboardCacheService } from '../../core/services/dashboard-cache.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css']
})
export class ShellComponent {
  constructor(public api: ApiService, private cache: DashboardCacheService) {}

  logout() {
    this.cache.invalidate();
    this.api.logout();
  }
}
