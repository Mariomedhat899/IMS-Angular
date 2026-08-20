import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-preloader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preloader" [class.hidden]="done">
      <div class="preloader-inner">
        <div class="preloader-art" aria-hidden="true">
          <div class="preloader-brand">IMS</div>
          <div class="barcode">
            <span *ngFor="let bar of bars" [style.height.px]="bar.h" [style.width.px]="bar.w"></span>
          </div>
          <div class="ticket">
            <div class="ticket-line"></div>
            <div class="ticket-no">№ {{ ticketNo }}</div>
          </div>
        </div>
        <div class="preloader-label">Inventory control</div>
        <div class="preloader-track" aria-hidden="true">
          <span class="bar" *ngFor="let _ of trackBars"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preloader {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #EDEFEA;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity .5s ease, visibility .5s ease;
      opacity: 1;
      visibility: visible;
    }
    .preloader.hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .preloader-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 22px;
    }
    .preloader-art {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .preloader-brand {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 56px;
      letter-spacing: -0.02em;
      color: #1C2321;
    }
    .barcode {
      display: flex;
      gap: 2px;
      align-items: flex-end;
      height: 26px;
      opacity: .9;
    }
    .barcode span {
      display: block;
      width: 2px;
      background: #5B655F;
      border-radius: 1px;
    }
    .ticket {
      position: relative;
      padding-top: 14px;
      margin-top: 4px;
      border-top: 1.5px dashed #D8DAD3;
      min-width: 180px;
      text-align: center;
    }
    .ticket-no {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      color: #5B655F;
      letter-spacing: 0.08em;
    }
    .preloader-label {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #5B655F;
    }
    .preloader-track {
      display: flex;
      gap: 4px;
      align-items: flex-end;
      height: 24px;
    }
    .bar {
      width: 3px;
      background: #1F6F63;
      border-radius: 2px;
      animation: barPulse 1s ease-in-out infinite;
    }
    @keyframes barPulse {
      0%, 100% { height: 5px; opacity: .3; }
      50% { height: 20px; opacity: 1; }
    }
  `]
})
export class PreloaderComponent implements OnInit {
  done = false;
  ticketNo = '';
  bars: { w: number; h: number }[] = [];
  trackBars = Array.from({ length: 20 });

  constructor(private router: Router) {}

  ngOnInit() {
    const seed = Math.floor(Math.random() * 8999 + 1000);
    this.ticketNo = String(seed);

    const widths = [2, 2, 4, 2, 6, 3];
    for (let i = 0; i < 40; i++) {
      const w = widths[Math.floor(Math.random() * widths.length)];
      const h = 8 + Math.floor(Math.random() * 18);
      this.bars.push({ w, h });
    }

    setTimeout(() => {
      this.done = true;
    }, 2000);
  }
}
