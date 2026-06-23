import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { formatPkr } from '../../core/services/currency';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon.component';

type Tab = 'summary'|'orders'|'installments'|'banners'|'products'|'categories'|'blog'|'users'|'vendors'|'kyc'|'payouts'|'payments'|'reports'|'audit';

interface PEdit {
  id:string; name:string; slug:string; shortDescription?:string|null; cashPrice:string;
  stock:number; status:string; lowestAdvance?:string|null; lowestMonthly?:string|null;
  category:{id?:string;name:string;slug:string}; brand:{id?:string;name:string;slug?:string}|null;
  images:Array<{id:string;url:string;alt?:string|null;isPrimary:boolean}>;
  plans:Array<{id:string;durationMonths:number;advanceAmount:string;monthlyAmount:string;totalPayable:string;markupPercentage:string;isActive:boolean}>;
}

@Component({
  selector:'app-admin-dashboard', standalone:true,
  imports:[CommonModule,FormsModule,IconComponent],
  changeDetection:ChangeDetectionStrategy.OnPush,
  template:`
<div class="flex h-screen bg-slate-100 overflow-hidden">

  <!-- SIDEBAR -->
  <aside class="w-60 bg-slate-900 text-white flex flex-col shrink-0 hidden lg:flex">
    <div class="p-4 border-b border-slate-700">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-primary grid place-items-center font-bold text-sm">Q</div>
        <div><div class="font-bold text-sm">QistPY Admin</div><div class="text-[10px] text-slate-400">{{ auth.user()?.name }}</div></div>
      </div>
    </div>
    <nav class="flex-1 overflow-y-auto py-2">
      @for (g of tabGroups; track g.label) {
        <div class="px-3 pt-3 pb-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{{ g.label }}</div>
        @for (t of g.tabs; track t.id) {
          <button type="button" (click)="switchTab(t.id)"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg mx-1 transition-all mb-0.5"
            [class.bg-primary]="tab()===t.id" [class.text-white]="tab()===t.id"
            [class.text-slate-300]="tab()!==t.id" [class.hover:bg-slate-800]="tab()!==t.id">
            <span class="text-base">{{t.icon}}</span><span>{{t.label}}</span>
            @if(t.id==='orders'&&pendingCount()>0){<span class="ml-auto bg-red-500 text-white text-[9px] rounded-full px-1.5 py-0.5 font-bold">{{pendingCount()}}</span>}
          </button>
        }
      }
    </nav>
    <div class="p-3 border-t border-slate-700 space-y-1">
      <a href="/" target="_blank" class="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded hover:bg-slate-800">↗ View Site</a>
      <button type="button" (click)="logout()" class="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded hover:bg-slate-800">⎋ Logout</button>
    </div>
  </aside>

  <!-- MAIN -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Top header -->
    <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
      <h1 class="text-lg font-heading font-bold text-ink">{{ currentTabLabel() }}</h1>
      <div class="flex items-center gap-2 text-sm text-muted">
        <span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
        System Online
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto p-6">

      <!-- ╔══ SUMMARY ══╗ -->
      @if(tab()==='summary'){
        @if(summary();as s){
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            @for(c of summaryCards(s);track c.label){
              <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" (click)="c.tab&&switchTab(c.tab)">
                <div class="flex items-start justify-between mb-3">
                  <div class="text-2xl">{{c.icon}}</div>
                  @if(c.badge){<span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [class]="c.badgeClass || 'bg-slate-100 text-slate-600'">{{c.badge}}</span>}
                </div>
                <div class="text-2xl font-heading font-bold" [class.text-primary]="c.primary" [class.text-ink]="!c.primary">{{c.value}}</div>
                <div class="text-xs text-muted mt-0.5 font-medium">{{c.label}}</div>
              </div>
            }
          </div>
          <!-- Sales report summary -->
          @if(report();as r){
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div class="text-xs text-muted font-semibold uppercase mb-1">Total Revenue Collected</div>
                <div class="text-2xl font-heading font-bold text-green-600 tabular-nums">{{fmt(r.revenue?.total)}}</div>
                <div class="text-xs text-muted mt-1">This month: <strong class="text-ink tabular-nums">{{fmt(r.revenue?.thisMonth)}}</strong></div>
              </div>
              <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div class="text-xs text-muted font-semibold uppercase mb-2">Top Products</div>
                @for(p of r.topProducts?.slice(0,3);track p.name){
                  <div class="flex justify-between text-sm py-0.5"><span class="text-muted truncate">{{p.name}}</span><strong>{{p.count}} orders</strong></div>
                }
              </div>
              <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div class="text-xs text-muted font-semibold uppercase mb-2">Quick Actions</div>
                <div class="space-y-2">
                  <button type="button" (click)="switchTab('orders')" class="w-full text-left text-sm px-3 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 font-medium">🛒 {{s.installments?.pending??0}} Pending Orders</button>
                  <button type="button" (click)="runReminders()" class="w-full text-left text-sm px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium">⏰ Run Daily Reminders</button>
                </div>
              </div>
            </div>
          }
        }
      }

      <!-- ╔══ ORDERS ══╗ -->
      @if(tab()==='orders'){
        <div class="flex gap-3 mb-4 flex-wrap">
          <select [(ngModel)]="orderFilter" (ngModelChange)="loadOrders()" class="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">All Orders</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="APPROVED">✅ Approved</option>
            <option value="ACTIVE">🔄 Active</option>
            <option value="COMPLETED">🎉 Completed</option>
            <option value="REJECTED">❌ Rejected</option>
          </select>
          <button type="button" (click)="loadOrders()" class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm hover:bg-slate-50">↻ Refresh</button>
        </div>
        @if(orders().length===0){<div class="bg-white rounded-2xl p-12 text-center border border-slate-200"><div class="text-5xl mb-3">📭</div><p class="text-muted">No orders.</p></div>}
        <div class="space-y-3">
          @for(req of orders();track req.id){
            <div class="bg-white rounded-2xl border shadow-sm overflow-hidden"
              [class.border-amber-300]="req.status==='PENDING'" [class.border-blue-300]="req.status==='APPROVED'"
              [class.border-green-300]="req.status==='ACTIVE'||req.status==='COMPLETED'" [class.border-red-300]="req.status==='REJECTED'"
              [class.border-slate-200]="!['PENDING','APPROVED','ACTIVE','COMPLETED','REJECTED'].includes(req.status)">
              <!-- Status bar -->
              <div class="px-5 py-3 flex items-center justify-between flex-wrap gap-2"
                [class.bg-amber-50]="req.status==='PENDING'" [class.bg-blue-50]="req.status==='APPROVED'"
                [class.bg-green-50]="req.status==='ACTIVE'||req.status==='COMPLETED'" [class.bg-red-50]="req.status==='REJECTED'" [class.bg-slate-50]="!['PENDING','APPROVED','ACTIVE','COMPLETED','REJECTED'].includes(req.status)">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                    [class.bg-amber-500]="req.status==='PENDING'" [class.bg-blue-500]="req.status==='APPROVED'"
                    [class.bg-green-600]="req.status==='ACTIVE'||req.status==='COMPLETED'" [class.bg-red-500]="req.status==='REJECTED'" [class.bg-slate-500]="!['PENDING','APPROVED','ACTIVE','COMPLETED','REJECTED'].includes(req.status)">
                    {{req.status}}</span>
                  <span class="text-xs text-muted">{{fmtDate(req.createdAt)}}</span>
                </div>
                <div class="flex gap-2 flex-wrap">
                  @if(req.status==='PENDING'){
                    <button type="button" (click)="approveOrder(req.id)" class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">✓ Approve</button>
                    <button type="button" (click)="rejectOrder(req.id)" class="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50">✗ Reject</button>
                  }
                  @if(req.status==='APPROVED'||req.status==='ACTIVE'){
                    <button type="button" (click)="openPayModal(req)" class="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold">💰 Record Payment</button>
                  }
                </div>
              </div>
              <!-- Body -->
              <div class="p-5 grid md:grid-cols-2 gap-4">
                <div>
                  <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">👤 Customer</p>
                  <div class="space-y-0.5 text-sm">
                    <div><span class="text-muted">Name:</span> <strong>{{req.customer?.name}}</strong></div>
                    <div><span class="text-muted">Phone:</span> <span class="tabular-nums">{{req.customer?.phone}}</span></div>
                    <div><span class="text-muted">CNIC:</span> <span class="tabular-nums">{{req.customer?.cnic||'—'}}</span></div>
                    @if(req.customer?.email){<div><span class="text-muted">Email:</span> {{req.customer.email}}</div>}
                  </div>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">📦 Order</p>
                  <div class="space-y-0.5 text-sm">
                    <div><span class="text-muted">Product:</span> <strong>{{req.orderItem?.product?.name}}</strong></div>
                    <div><span class="text-muted">Duration:</span> {{req.installmentPlan?.durationMonths}} months</div>
                    <div><span class="text-muted">Advance:</span> <strong class="text-primary tabular-nums">{{fmt(req.installmentPlan?.advanceAmount)}}</strong></div>
                    <div><span class="text-muted">Monthly:</span> <span class="tabular-nums">{{fmt(req.installmentPlan?.monthlyAmount)}}</span></div>
                    <div class="pt-1 border-t mt-1"><span class="text-muted">Total:</span> <strong class="tabular-nums">{{fmt(req.installmentPlan?.totalPayable)}}</strong></div>
                  </div>
                </div>
              </div>
              <!-- Schedule -->
              @if(req.schedules?.length){
                <div class="px-5 pb-4">
                  <div class="flex justify-between items-center mb-2">
                    <p class="text-[10px] font-bold text-muted uppercase">📅 Schedule — Paid: <span class="text-green-600">{{calcPaid(req)}}</span> · Remaining: <span class="text-amber-600">{{calcRemStr(req)}}</span></p>
                    <div class="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-green-500 rounded-full" [style.width.%]="calcPct(req)"></div></div>
                  </div>
                  <table class="w-full text-xs">
                    <thead><tr class="text-muted border-b border-slate-100"><th class="text-left pb-1">#</th><th class="text-left pb-1">Due</th><th class="text-right pb-1">Amount</th><th class="text-right pb-1">Paid</th><th class="text-center pb-1">Status</th><th class="text-center pb-1">Action</th></tr></thead>
                    <tbody>
                      @for(s of req.schedules;track s.id){
                        <tr class="border-b border-slate-50">
                          <td class="py-1 font-semibold">{{s.installmentNo}}</td>
                          <td class="py-1">{{fmtDate(s.dueDate)}}</td>
                          <td class="py-1 text-right tabular-nums">{{fmt(s.amount)}}</td>
                          <td class="py-1 text-right tabular-nums text-green-600">{{s.paidAmount?fmt(s.paidAmount):'—'}}</td>
                          <td class="py-1 text-center"><span class="px-1.5 py-0.5 rounded text-[9px] font-bold"
                            [class.bg-green-100]="s.status==='PAID'" [class.text-green-700]="s.status==='PAID'"
                            [class.bg-red-100]="s.status==='OVERDUE'" [class.text-red-700]="s.status==='OVERDUE'"
                            [class.bg-slate-100]="s.status==='PENDING'" [class.text-slate-600]="s.status==='PENDING'">{{s.status}}</span></td>
                          <td class="py-1 text-center">@if(s.status!=='PAID'){<button type="button" (click)="quickPay(req,s.installmentNo)" class="px-2 py-0.5 bg-primary text-white rounded text-[9px] font-bold">Pay</button>}</td>
                        </tr>
                      }
                    </tbody>
                    <tfoot class="border-t-2 border-slate-200 font-bold text-xs"><tr>
                      <td colspan="2" class="pt-1.5 text-muted">TOTAL</td>
                      <td class="pt-1.5 text-right tabular-nums">{{fmt(req.installmentPlan?.totalPayable)}}</td>
                      <td class="pt-1.5 text-right tabular-nums text-green-600">{{calcPaid(req)}}</td>
                      <td colspan="2" class="pt-1.5 text-center text-muted">{{calcPaidN(req)}}/{{totalInstN(req)}}</td>
                    </tr></tfoot>
                  </table>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ╔══ INSTALLMENTS ══╗ -->
      @if(tab()==='installments'){
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm"><div class="text-xs text-muted font-semibold uppercase">Active Plans</div><div class="text-2xl font-heading font-bold text-primary mt-1">{{installments().length}}</div></div>
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm"><div class="text-xs text-muted font-semibold uppercase">Total Value</div><div class="text-lg font-heading font-bold tabular-nums mt-1">{{fmt(totalVal())}}</div></div>
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm"><div class="text-xs text-muted font-semibold uppercase">Collected</div><div class="text-lg font-heading font-bold text-green-600 tabular-nums mt-1">{{fmt(totalCol())}}</div></div>
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm"><div class="text-xs text-muted font-semibold uppercase">Remaining</div><div class="text-lg font-heading font-bold text-amber-600 tabular-nums mt-1">{{fmt(totalRem())}}</div></div>
        </div>

        @if(selUser()){
          <!-- Detail view -->
          <div class="bg-white rounded-2xl border-2 border-primary shadow-sm">
            <div class="p-4 bg-primary/5 border-b border-primary/20 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary text-white grid place-items-center font-bold">{{(selUser()!.customer?.name||'U').charAt(0).toUpperCase()}}</div>
                <div><div class="font-bold">{{selUser()!.customer?.name}}</div><div class="text-xs text-muted tabular-nums">{{selUser()!.customer?.phone}} · CNIC: {{selUser()!.customer?.cnic||'—'}}</div></div>
              </div>
              <button type="button" (click)="selUser.set(null)" class="px-3 py-1.5 bg-white border rounded-xl text-sm font-semibold">← Back</button>
            </div>
            <div class="p-5 space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-slate-50 rounded-xl p-4 text-sm">
                  <p class="text-[10px] font-bold text-muted uppercase mb-2">Plan</p>
                  <div><span class="text-muted">Product:</span> <strong>{{selUser()!.orderItem?.product?.name}}</strong></div>
                  <div><span class="text-muted">Duration:</span> {{selUser()!.installmentPlan?.durationMonths}} months</div>
                  <div><span class="text-muted">Advance:</span> <strong class="text-primary tabular-nums">{{fmt(selUser()!.installmentPlan?.advanceAmount)}}</strong></div>
                  <div><span class="text-muted">Monthly:</span> <span class="tabular-nums">{{fmt(selUser()!.installmentPlan?.monthlyAmount)}}</span></div>
                  <div class="border-t mt-1 pt-1"><span class="text-muted">Total:</span> <strong class="tabular-nums">{{fmt(selUser()!.installmentPlan?.totalPayable)}}</strong></div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4">
                  <p class="text-[10px] font-bold text-muted uppercase mb-2">Payment Progress</p>
                  <div class="flex justify-between text-sm mb-1.5">
                    <span class="text-green-600 font-bold tabular-nums">{{calcPaid(selUser()!)}} paid</span>
                    <span class="text-amber-600 font-bold tabular-nums">{{calcRemStr(selUser()!)}} left</span>
                  </div>
                  <div class="h-3 bg-slate-200 rounded-full overflow-hidden"><div class="h-full bg-green-500 rounded-full" [style.width.%]="calcPct(selUser()!)"></div></div>
                  <div class="text-xs text-muted mt-1.5">{{calcPaidN(selUser()!)}} of {{totalInstN(selUser()!)}} installments paid · {{calcPct(selUser()!)}}%</div>
                </div>
              </div>
              <table class="w-full text-sm">
                <thead class="text-xs text-muted uppercase border-b border-slate-200">
                  <tr><th class="text-left pb-2">#</th><th class="text-left pb-2">Due Date</th><th class="text-right pb-2">Amount</th><th class="text-right pb-2">Paid</th><th class="text-center pb-2">Status</th><th class="text-center pb-2">Action</th></tr>
                </thead>
                <tbody>
                  @for(s of selUser()!.schedules;track s.id){
                    <tr class="border-b border-slate-100">
                      <td class="py-2 font-semibold">{{s.installmentNo}}</td>
                      <td class="py-2">{{fmtDate(s.dueDate)}}</td>
                      <td class="py-2 text-right tabular-nums">{{fmt(s.amount)}}</td>
                      <td class="py-2 text-right tabular-nums font-semibold text-green-600">{{s.paidAmount?fmt(s.paidAmount):'—'}}</td>
                      <td class="py-2 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        [class.bg-green-100]="s.status==='PAID'" [class.text-green-700]="s.status==='PAID'"
                        [class.bg-red-100]="s.status==='OVERDUE'" [class.text-red-700]="s.status==='OVERDUE'"
                        [class.bg-slate-100]="s.status==='PENDING'" [class.text-slate-600]="s.status==='PENDING'">{{s.status}}</span></td>
                      <td class="py-2 text-center">
                        @if(s.status!=='PAID'){<button type="button" (click)="quickPay(selUser()!,s.installmentNo)" class="px-2 py-1 bg-primary text-white rounded-lg text-xs font-semibold">Mark Paid</button>}
                        @else{<span class="text-green-500 text-xs">✓</span>}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot class="border-t-2 border-slate-200 font-bold"><tr>
                  <td colspan="2" class="pt-2 text-muted text-xs">TOTAL</td>
                  <td class="pt-2 text-right tabular-nums">{{fmt(selUser()!.installmentPlan?.totalPayable)}}</td>
                  <td class="pt-2 text-right tabular-nums text-green-600">{{calcPaid(selUser()!)}}</td>
                  <td colspan="2" class="pt-2 text-center text-xs text-muted">{{calcPaidN(selUser()!)}}/{{totalInstN(selUser()!)}}</td>
                </tr></tfoot>
              </table>
              <button type="button" (click)="openPayModal(selUser()!)" class="w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark">💰 Record Payment</button>
            </div>
          </div>
        }@else{
          <!-- List -->
          @if(installments().length===0){<div class="bg-white rounded-2xl p-12 text-center border border-slate-200"><div class="text-5xl mb-2">📋</div><p class="text-muted">No active plans.</p></div>}
          <div class="space-y-2">
            @for(req of installments();track req.id){
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all" (click)="selUser.set(req)">
                <div class="flex items-center gap-3 flex-wrap">
                  <div class="w-10 h-10 rounded-full bg-primary text-white grid place-items-center font-bold text-sm shrink-0">{{(req.customer?.name||'U').charAt(0).toUpperCase()}}</div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-ink">{{req.customer?.name}}</div>
                    <div class="text-xs text-muted tabular-nums">{{req.customer?.phone}}</div>
                  </div>
                  <div class="hidden md:block text-sm text-muted flex-1 truncate">{{req.orderItem?.product?.name}}</div>
                  <div class="hidden md:flex flex-col items-end gap-0.5 w-28">
                    <div class="flex justify-between text-[10px] text-muted w-full"><span>{{calcPaidN(req)}}/{{totalInstN(req)}}</span><span class="text-green-600 font-semibold">{{calcPct(req)}}%</span></div>
                    <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-green-500 rounded-full" [style.width.%]="calcPct(req)"></div></div>
                  </div>
                  <div class="text-right"><div class="text-xs text-green-600 font-semibold tabular-nums">{{calcPaid(req)}}</div><div class="text-xs text-muted tabular-nums">{{calcRemStr(req)}} left</div></div>
                  @if(hasOverdue(req)){<span class="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">⚠ OVERDUE</span>}
                  <span class="text-slate-400">›</span>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ╔══ BANNERS ══╗ -->
      @if(tab()==='banners'){
        <div class="grid lg:grid-cols-2 gap-5">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 class="font-heading font-bold mb-4">🎯 Hero Banners (Left — 3 slides)</h3>
            <div class="space-y-4">
              @for(sl of heroBanners();track sl.id;let i=$index){
                <div class="border border-slate-200 rounded-xl p-4">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-primary bg-primary-50 px-2 py-1 rounded">Slide {{i+1}}</span>
                    <label class="flex items-center gap-1.5 text-xs cursor-pointer"><input type="checkbox" [(ngModel)]="sl.isActive" class="accent-primary"/>Active</label>
                  </div>
                  <div class="space-y-2">
                    <input type="text" [(ngModel)]="sl.badge" placeholder="🔥 Best Seller" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"/>
                    <input type="text" [(ngModel)]="sl.headline" placeholder="Product Name" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"/>
                    <input type="text" [(ngModel)]="sl.subtitle" placeholder="Subtitle / description" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"/>
                    <select [(ngModel)]="sl.ctaLink" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary">
                      <option value="">Select product...</option>
                      @for(p of prods();track p.id){<option [value]="'/product/'+p.slug">{{p.name}}</option>}
                    </select>
                    <input type="url" [(ngModel)]="sl.imageUrl" placeholder="https://i.ibb.co/... (ImgBB link)" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"/>
                    <div class="flex items-center gap-2">
                      <label class="text-[11px] text-muted">Color:</label>
                      <input type="color" [(ngModel)]="sl.bgColor" class="h-7 w-14 border rounded cursor-pointer"/>
                    </div>
                  </div>
                  <button type="button" (click)="saveBanner(sl)" class="mt-3 w-full py-2 bg-primary text-white rounded-xl text-sm font-semibold">💾 Save</button>
                </div>
              }
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 class="font-heading font-bold mb-4">🎁 Offer Banners (Right — 3 slides)</h3>
            <div class="space-y-4">
              @for(sl of offerBanners();track sl.id;let i=$index){
                <div class="border border-slate-200 rounded-xl p-4">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Offer {{i+1}}</span>
                  </div>
                  <div class="space-y-2">
                    <input type="text" [(ngModel)]="sl.badge" placeholder="Special Offer" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"/>
                    <select [(ngModel)]="sl.ctaLink" (ngModelChange)="autoFill(sl)" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary">
                      <option value="">Select product (auto-fills plan)...</option>
                      @for(p of prods();track p.id){<option [value]="'/product/'+p.slug">{{p.name}}</option>}
                    </select>
                    <input type="text" [(ngModel)]="sl.subtitle" placeholder="Subtitle" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"/>
                    <input type="url" [(ngModel)]="sl.imageUrl" placeholder="https://i.ibb.co/..." class="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"/>
                    <div class="grid grid-cols-3 gap-2">
                      <input type="text" [(ngModel)]="sl.advance" placeholder="Advance" class="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary tabular-nums"/>
                      <input type="text" [(ngModel)]="sl.monthly" placeholder="Monthly" class="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary tabular-nums"/>
                      <select [(ngModel)]="sl.months" class="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                        <option [value]="3">3mo</option><option [value]="6">6mo</option><option [value]="12">12mo</option>
                      </select>
                    </div>
                    <div class="flex items-center gap-2"><label class="text-[11px] text-muted">Color:</label><input type="color" [(ngModel)]="sl.bgColor" class="h-7 w-14 border rounded cursor-pointer"/></div>
                  </div>
                  <button type="button" (click)="saveBanner(sl)" class="mt-3 w-full py-2 bg-green-600 text-white rounded-xl text-sm font-semibold">💾 Save</button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ╔══ BLOG ══╗ -->
      @if(tab()==='blog'){
        <div class="flex gap-3 mb-4 items-center">
          <button type="button" (click)="openBlogAdd()" class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold">+ New Post</button>
        </div>
        @if(blogPosts().length===0){<div class="bg-white rounded-2xl p-12 text-center border border-slate-200"><p class="text-muted">No blog posts yet.</p></div>}
        <div class="space-y-2">
          @for(b of blogPosts();track b.id){
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-4 items-center flex-wrap">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-heading font-bold text-ink">{{b.title}}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    [class.bg-green-100]="b.isPublished" [class.text-green-700]="b.isPublished"
                    [class.bg-amber-100]="!b.isPublished" [class.text-amber-700]="!b.isPublished">
                    {{b.isPublished ? 'Published' : 'Draft'}}
                  </span>
                </div>
                <div class="text-xs text-muted mt-0.5">{{b.category?.name ?? 'Uncategorized'}} · /blog/{{b.slug}}</div>
              </div>
              <div class="flex gap-2 shrink-0">
                <button type="button" (click)="openBlogEdit(b)" class="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200">Edit</button>
                <button type="button" (click)="toggleBlogPublish(b)" class="px-3 py-1.5 text-xs font-semibold bg-primary-50 text-primary rounded-lg hover:bg-primary-100">
                  {{b.isPublished ? 'Unpublish' : 'Publish'}}
                </button>
                <button type="button" (click)="deleteBlogPost(b)" class="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ╔══ PRODUCTS ══╗ -->
      @if(tab()==='products'){
        <div class="flex gap-3 mb-4 flex-wrap items-center">
          <input type="search" [(ngModel)]="pSearch" (ngModelChange)="filterP()" placeholder="Search..." class="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm w-48 focus:outline-none focus:border-primary"/>
          <select [(ngModel)]="pStatus" (ngModelChange)="filterP()" class="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm"><option value="">All</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option></select>
          <button type="button" (click)="openAdd()" class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold">+ Add Product</button>
        </div>
        @if(filtP().length===0){<div class="bg-white rounded-2xl p-12 text-center border border-slate-200"><p class="text-muted">No products.</p></div>}
        <div class="space-y-2">
          @for(p of filtP();track p.id){
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-4 items-start flex-wrap hover:border-slate-300 transition-colors">
              <div class="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                @if(p.images[0]){<img [src]="p.images[0].url" [alt]="p.name" class="w-full h-full object-contain p-1"/>}
                @else{<div class="w-full h-full grid place-items-center text-slate-300 text-2xl">📦</div>}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start gap-2 flex-wrap">
                  <span class="font-heading font-bold text-ink">{{p.name}}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    [class.bg-green-100]="p.status==='PUBLISHED'" [class.text-green-700]="p.status==='PUBLISHED'"
                    [class.bg-amber-100]="p.status==='DRAFT'" [class.text-amber-700]="p.status==='DRAFT'">{{p.status}}</span>
                </div>
                <div class="text-xs text-muted mt-0.5">{{p.category.name}}@if(p.brand){ · {{p.brand.name}}}</div>
                <div class="flex gap-4 mt-1 text-sm flex-wrap tabular-nums">
                  <span>Cash: <strong>{{fmt(p.cashPrice)}}</strong></span>
                  @if(p.lowestAdvance){<span class="text-primary">Adv: <strong>{{fmt(p.lowestAdvance)}}</strong></span>}
                  <span class="text-muted">Stock: {{p.stock}}</span>
                </div>
                @if(p.plans.length){
                  <div class="flex gap-1.5 mt-1 flex-wrap">
                    @for(pl of p.plans;track pl.id){<span class="text-[10px] bg-primary-50 text-primary px-2 py-0.5 rounded-full">{{pl.durationMonths}}mo: {{fmt(pl.advanceAmount)}} adv</span>}
                  </div>
                }
              </div>
              <div class="flex gap-1.5 flex-wrap shrink-0">
                <button type="button" (click)="openEdit(p)" class="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold hover:bg-slate-200">✏️ Edit</button>
                <button type="button" (click)="openImg(p)" class="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold hover:bg-slate-200">📷 Images</button>
                <button type="button" (click)="openPlans(p)" class="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold hover:bg-slate-200">📋 Plans</button>
                <button type="button" (click)="togPublish(p)" class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  [class.bg-primary]="p.status==='DRAFT'" [class.text-white]="p.status==='DRAFT'"
                  [class.bg-slate-100]="p.status==='PUBLISHED'" [class.text-slate-700]="p.status==='PUBLISHED'">{{p.status==='PUBLISHED'?'Unpublish':'Publish'}}</button>
                <button type="button" (click)="delProd(p)" class="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">🗑️</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ╔══ CATEGORIES ══╗ -->
      @if(tab()==='categories'){
        <div class="flex gap-3 mb-4">
          <button type="button" (click)="catEditObj={id:'',name:'',slug:'',imageUrl:'',description:'',isActive:true};showCatModal=true" class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold">+ Add Category</button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          @for(c of cats();track c.id){
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center hover:border-primary transition-colors">
              <div class="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 border-2 border-slate-200">
                @if(c.imageUrl){<img [src]="c.imageUrl" [alt]="c.name" class="w-full h-full object-cover"/>}
                @else{<div class="w-full h-full bg-slate-100 grid place-items-center text-2xl">🛍️</div>}
              </div>
              <div class="font-semibold text-sm text-ink">{{c.name}}</div>
              <div class="text-[10px] text-muted mt-0.5">{{c.slug}}</div>
              <span class="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block" [class.bg-green-100]="c.isActive" [class.text-green-700]="c.isActive" [class.bg-slate-100]="!c.isActive" [class.text-slate-500]="!c.isActive">{{c.isActive?'Active':'Hidden'}}</span>
              <div class="flex gap-1.5 mt-3 justify-center">
                <button type="button" (click)="editCat(c)" class="px-2 py-1 bg-slate-100 rounded-lg text-xs font-semibold">Edit</button>
                <button type="button" (click)="delCat(c.id,c.name)" class="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">Delete</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ╔══ USERS ══╗ -->
      @if(tab()==='users'){
        <input type="search" [(ngModel)]="uQuery" (ngModelChange)="searchU()" placeholder="Search name/phone..." class="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm w-full max-w-sm mb-4 focus:outline-none focus:border-primary"/>
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-xs text-muted uppercase border-b border-slate-200"><tr>
              <th class="text-left px-4 py-3">Name</th><th class="text-left px-4 py-3">Phone</th>
              <th class="text-left px-4 py-3">Role</th><th class="text-left px-4 py-3">KYC</th>
            </tr></thead>
            <tbody>
              @for(u of usrs();track u.id){
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="px-4 py-3 font-medium">{{u.name||'—'}}</td>
                  <td class="px-4 py-3 tabular-nums text-muted">{{u.phone}}</td>
                  <td class="px-4 py-3"><span class="px-2 py-0.5 bg-primary-50 text-primary text-[10px] font-bold rounded-full">{{u.role}}</span></td>
                  <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    [class.bg-green-100]="u.kycStatus==='APPROVED'" [class.text-green-700]="u.kycStatus==='APPROVED'"
                    [class.bg-amber-100]="u.kycStatus==='PENDING'" [class.text-amber-700]="u.kycStatus==='PENDING'"
                    [class.bg-slate-100]="u.kycStatus==='NOT_SUBMITTED'" [class.text-slate-500]="u.kycStatus==='NOT_SUBMITTED'">{{u.kycStatus}}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ╔══ VENDORS ══╗ -->
      @if(tab()==='vendors'){
        <div class="space-y-2">
          @for(v of vends();track v.id){
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex justify-between items-start flex-wrap gap-3">
              <div><div class="font-semibold">{{v.businessName}}</div><div class="text-xs text-muted">{{v.user?.name}} · {{v.user?.phone}}</div>
                <span class="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white" [class.bg-green-600]="v.status==='APPROVED'" [class.bg-amber-500]="v.status==='PENDING'" [class.bg-red-500]="v.status==='SUSPENDED'">{{v.status}}</span>
              </div>
              <div class="flex gap-2">
                @if(v.status==='PENDING'){<button type="button" (click)="approveVend(v.id)" class="px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold">Approve</button>}
                @if(v.status!=='SUSPENDED'){<button type="button" (click)="suspVend(v.id)" class="px-3 py-1.5 bg-slate-100 text-red-600 rounded-xl text-xs font-bold">Suspend</button>}
              </div>
            </div>
          }
        </div>
      }

      <!-- ╔══ KYC ══╗ -->
      @if(tab()==='kyc'){
        @if(kycQ().length===0){<div class="bg-white rounded-2xl p-8 text-center border border-slate-200 text-muted">No pending KYC</div>}
        <div class="space-y-2">
          @for(u of kycQ();track u.id){
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex justify-between items-start flex-wrap gap-3">
              <div><div class="font-semibold">{{u.name}}</div><div class="text-xs text-muted">{{u.phone}} · {{u.cnic}}</div></div>
              <div class="flex gap-2">
                <button type="button" (click)="reviewKyc(u.id,true)" class="px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold">Approve</button>
                <button type="button" (click)="reviewKyc(u.id,false)" class="px-3 py-1.5 bg-slate-100 text-red-600 rounded-xl text-xs font-bold">Reject</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ╔══ PAYOUTS ══╗ -->
      @if(tab()==='payouts'){
        <div class="space-y-2">
          @for(p of payO();track p.id){
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex justify-between items-start flex-wrap gap-3">
              <div><div class="font-semibold">{{p.vendor?.businessName}}</div><div class="font-bold text-primary tabular-nums text-sm mt-0.5">{{fmt(p.amount)}}</div><div class="text-xs text-muted">{{p.bankName}} — {{p.accountTitle}}</div></div>
              <div class="flex gap-2">
                @if(p.status==='REQUESTED'){<button type="button" (click)="approvePay(p.id)" class="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold">Approve</button>}
                @if(p.status==='APPROVED'){<button type="button" (click)="markPaid(p.id)" class="px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold">Mark Paid</button>}
              </div>
            </div>
          }
        </div>
      }

      <!-- ╔══ PAYMENTS ══╗ -->
      @if(tab()==='payments'){
        @if(payR().length===0){<div class="bg-white rounded-2xl p-8 text-center border border-slate-200 text-muted">No payments pending</div>}
        <div class="space-y-2">
          @for(p of payR();track p.id){
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex justify-between items-start flex-wrap gap-3">
              <div>
                <div class="font-semibold tabular-nums">{{fmt(p.amount)}} — {{p.method}}</div>
                <div class="text-xs text-muted">{{p.request?.customer?.name}} ({{p.request?.customer?.phone}})</div>
                @if(p.screenshotUrl){<a [href]="p.screenshotUrl" target="_blank" class="text-xs text-primary hover:underline">View screenshot →</a>}
              </div>
              <div class="flex gap-2">
                <button type="button" (click)="reviewPay(p.id,'APPROVE')" class="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold">Approve</button>
                <button type="button" (click)="reviewPay(p.id,'REJECT')" class="px-3 py-1.5 bg-slate-100 text-red-600 rounded-xl text-xs font-bold">Reject</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ╔══ REPORTS ══╗ -->
      @if(tab()==='reports'){
        @if(report();as r){
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"><div class="text-xs text-muted uppercase font-semibold">Total Revenue</div><div class="text-2xl font-heading font-bold text-green-600 tabular-nums mt-1">{{fmt(r.revenue?.total)}}</div></div>
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"><div class="text-xs text-muted uppercase font-semibold">This Month</div><div class="text-2xl font-heading font-bold text-primary tabular-nums mt-1">{{fmt(r.revenue?.thisMonth)}}</div></div>
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"><div class="text-xs text-muted uppercase font-semibold">Completed Orders</div><div class="text-2xl font-heading font-bold mt-1">{{r.orders?.completed}}</div></div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 class="font-heading font-bold mb-4">🏆 Top Products</h3>
            <div class="space-y-2">
              @for(p of r.topProducts;track p.name;let i=$index){
                <div class="flex items-center gap-3">
                  <span class="text-lg font-bold text-muted w-6">{{i+1}}</span>
                  <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full" [style.width.%]="(p.count/r.topProducts[0].count)*100"></div>
                  </div>
                  <span class="text-sm font-semibold w-32 truncate">{{p.name}}</span>
                  <span class="text-xs text-muted tabular-nums w-16 text-right">{{p.count}} orders</span>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- ╔══ AUDIT ══╗ -->
      @if(tab()==='audit'){
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          @for(a of auditL();track a.id){
            <div class="px-4 py-3 border-b border-slate-100 last:border-0 flex items-center gap-3 flex-wrap">
              <span class="px-2 py-0.5 bg-primary-50 text-primary text-[10px] font-bold rounded">{{a.action}}</span>
              <span class="text-xs text-muted">on {{a.entity}}</span>
              @if(a.actor){<span class="text-xs text-muted">by {{a.actor.name||a.actor.role}}</span>}
              <span class="ml-auto text-xs text-muted tabular-nums">{{fmtDate(a.createdAt)}}</span>
            </div>
          }
        </div>
      }

    </main>
  </div>
</div>

<!-- ══ MODALS ══ -->

<!-- Payment Modal -->
@if(payMod()){
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="payMod.set(null)">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" (click)="$event.stopPropagation()">
      <h3 class="font-heading font-bold text-lg mb-1">💰 Record Payment</h3>
      <div class="bg-slate-50 rounded-xl p-3 mb-4 text-sm">
        <strong>{{payMod()!.customer?.name}}</strong>
        <div class="text-muted text-xs">{{payMod()!.orderItem?.product?.name}}</div>
      </div>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-semibold text-muted block mb-1">Installment # (0=auto)</label>
            <input type="number" [(ngModel)]="payInstNo" min="0" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
          <div><label class="text-xs font-semibold text-muted block mb-1">Amount (Rs) *</label>
            <input type="number" [(ngModel)]="payAmt" min="1" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-primary"/></div>
        </div>
        <div><label class="text-xs font-semibold text-muted block mb-1">Screenshot URL (optional — Google Drive / ImgBB)</label>
          <input type="url" [(ngModel)]="payScreenshot" placeholder="https://drive.google.com/..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/>
          @if(payScreenshot){<div class="mt-2 p-2 bg-blue-50 rounded-xl text-xs text-blue-700">📸 Screenshot will be saved as payment record</div>}
        </div>
        <div><label class="text-xs font-semibold text-muted block mb-1">Note</label>
          <input type="text" [(ngModel)]="payNote" placeholder="Cash, JazzCash, EasyPaisa..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        @if(mErr()){<div class="bg-red-50 text-red-600 text-xs p-2.5 rounded-xl">{{mErr()}}</div>}
        <div class="flex gap-2">
          <button type="button" (click)="submitPay()" [disabled]="!payAmt||mSaving()" class="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50">{{mSaving()?'Saving...':'✓ Record Payment'}}</button>
          <button type="button" (click)="payMod.set(null)" class="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">Cancel</button>
        </div>
      </div>
    </div>
  </div>
}

<!-- Blog Add/Edit Modal -->
@if(blogEdit()){
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="blogEdit.set(null)">
    <div class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" (click)="$event.stopPropagation()">
      <div class="flex justify-between items-center mb-5">
        <h3 class="text-lg font-heading font-bold">{{blogIsAdd()?'New Blog Post':'Edit Blog Post'}}</h3>
        <button type="button" (click)="blogEdit.set(null)">✕</button>
      </div>
      <form (ngSubmit)="saveBlogPost()" class="space-y-3">
        <div><label class="text-xs font-semibold text-muted block mb-1">Title *</label>
          <input type="text" [(ngModel)]="blogF.title" name="title" required class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        <div><label class="text-xs font-semibold text-muted block mb-1">URL Slug (leave blank to auto-generate)</label>
          <input type="text" [(ngModel)]="blogF.slug" name="slug" placeholder="auto-generated-from-title" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        <div><label class="text-xs font-semibold text-muted block mb-1">Category</label>
          <select [(ngModel)]="blogF.categoryId" name="categoryId" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-primary">
            <option value="">None</option>
            @for(c of blogCats();track c.id){<option [value]="c.id">{{c.name}}</option>}
          </select></div>
        <div><label class="text-xs font-semibold text-muted block mb-1">Excerpt (shown on blog list, 10-300 chars) *</label>
          <textarea [(ngModel)]="blogF.excerpt" name="excerpt" rows="2" required class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"></textarea></div>
        <div><label class="text-xs font-semibold text-muted block mb-1">Content *</label>
          <textarea [(ngModel)]="blogF.content" name="content" rows="10" required class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"></textarea></div>
        <div><label class="text-xs font-semibold text-muted block mb-1">Cover Image URL</label>
          <input type="url" [(ngModel)]="blogF.coverImageUrl" name="coverImageUrl" placeholder="https://i.ibb.co/..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        <div><label class="text-xs font-semibold text-muted block mb-1">SEO Title (defaults to title if blank)</label>
          <input type="text" [(ngModel)]="blogF.metaTitle" name="metaTitle" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        <div><label class="text-xs font-semibold text-muted block mb-1">SEO Description (defaults to excerpt if blank)</label>
          <textarea [(ngModel)]="blogF.metaDescription" name="metaDescription" rows="2" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"></textarea></div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" [(ngModel)]="blogF.isPublished" name="isPublished" class="accent-primary w-4 h-4"/>
          <span class="text-sm text-ink">Published (visible on the live blog)</span>
        </label>
        @if(mErr()){<div class="bg-red-50 text-red-600 text-xs p-2.5 rounded-xl">{{mErr()}}</div>}
        <div class="flex gap-2 pt-2">
          <button type="submit" [disabled]="mSaving()" class="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50">{{mSaving()?'Saving...':'✓ Save Post'}}</button>
          <button type="button" (click)="blogEdit.set(null)" class="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">Cancel</button>
        </div>
      </form>
    </div>
  </div>
}

<!-- Product Add/Edit Modal -->
@if(editP()){
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="editP.set(null)">
    <div class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" (click)="$event.stopPropagation()">
      <div class="flex justify-between items-center mb-5">
        <h3 class="text-lg font-heading font-bold">{{isAdd()?'Add Product':'Edit Product'}}</h3>
        <button type="button" (click)="editP.set(null)">✕</button>
      </div>
      <form (ngSubmit)="saveP()" class="space-y-3">
        <div><label class="text-xs font-semibold text-muted block mb-1">Product Name *</label>
          <input type="text" [(ngModel)]="pF.name" name="name" required class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-semibold text-muted block mb-1">Cash Price (Rs) *</label>
            <input type="number" [(ngModel)]="pF.cashPrice" name="price" required min="1" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-primary"/></div>
          <div><label class="text-xs font-semibold text-muted block mb-1">Stock</label>
            <input type="number" [(ngModel)]="pF.stock" name="stock" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        </div>
        @if(isAdd()){
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-semibold text-muted block mb-1">Category *</label>
              <select [(ngModel)]="pF.categoryId" name="cat" required class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-primary">
                <option value="">Select...</option>@for(c of cats();track c.id){<option [value]="c.id">{{c.name}}</option>}
              </select></div>
            <div><label class="text-xs font-semibold text-muted block mb-1">Brand</label>
              <select [(ngModel)]="pF.brandId" name="brand" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-primary">
                <option value="">None</option>@for(b of brands();track b.id){<option [value]="b.id">{{b.name}}</option>}
              </select></div>
          </div>
          <div><label class="text-xs font-semibold text-muted block mb-1">Image URL (ImgBB/Google Drive)</label>
            <input type="url" [(ngModel)]="pF.imageUrl" name="img" placeholder="https://i.ibb.co/..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        }
        <div><label class="text-xs font-semibold text-muted block mb-1">Short Description</label>
          <input type="text" [(ngModel)]="pF.shortDescription" name="desc" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        <div><label class="text-xs font-semibold text-muted block mb-1">Full Description</label>
          <textarea [(ngModel)]="pF.description" name="fulldesc" rows="3" placeholder="• Feature 1&#10;• Feature 2" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary resize-none"></textarea></div>
        @if(mErr()){<div class="bg-red-50 text-red-600 text-xs p-2.5 rounded-xl">{{mErr()}}</div>}
        <div class="flex gap-2 pt-2">
          <button type="submit" [disabled]="mSaving()" class="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50">{{mSaving()?'Saving...':'Save'}}</button>
          <button type="button" (click)="editP.set(null)" class="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">Cancel</button>
        </div>
      </form>
    </div>
  </div>
}

<!-- Image Modal -->
@if(imgP()){
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="imgP.set(null)">
    <div class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" (click)="$event.stopPropagation()">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-heading font-bold">📷 {{imgP()!.name}}</h3>
        <button type="button" (click)="imgP.set(null)">✕</button>
      </div>
      @if(imgP()!.images.length){
        <div class="grid grid-cols-3 gap-2 mb-4">
          @for(img of imgP()!.images;track img.id){
            <div class="relative group aspect-square">
              <img [src]="img.url" [alt]="imgP()!.name" class="w-full h-full object-contain bg-slate-50 rounded-xl border-2" [class.border-primary]="img.isPrimary" [class.border-slate-200]="!img.isPrimary"/>
              @if(img.isPrimary){<span class="absolute top-1 left-1 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded font-bold">PRIMARY</span>}
              <button type="button" (click)="delImg(img.id)" class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">✕</button>
            </div>
          }
        </div>
      }
      <div class="border-t border-slate-200 pt-4 space-y-3">
        <p class="text-xs font-bold text-muted uppercase">Add Image</p>
        <input type="url" [(ngModel)]="newImgUrl" placeholder="https://i.ibb.co/... or Google Drive link" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/>
        <div class="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
          <strong>ImgBB:</strong> imgbb.com → Upload → Direct link → Paste ✅<br>
          <strong>Google Drive:</strong> Share → Anyone with link → Copy link → Paste (auto-converts) ✅
        </div>
        @if(newImgUrl){<img [src]="toDirectUrl(newImgUrl)" alt="preview" class="w-20 h-20 object-contain bg-slate-50 rounded-xl border border-slate-200"/>}
        <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" [(ngModel)]="newImgPrimary" class="accent-primary"/>Set as primary image</label>
        @if(mErr()){<div class="bg-red-50 text-red-600 text-xs p-2.5 rounded-xl">{{mErr()}}</div>}
        <div class="flex gap-2">
          <button type="button" (click)="addImg()" [disabled]="!newImgUrl||mSaving()" class="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50">{{mSaving()?'Adding...':'+ Add Image'}}</button>
          <button type="button" (click)="imgP.set(null)" class="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">Done</button>
        </div>
      </div>
    </div>
  </div>
}

<!-- Plans Modal -->
@if(plansP()){
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="plansP.set(null)">
    <div class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" (click)="$event.stopPropagation()">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-heading font-bold">📋 {{plansP()!.name}}</h3>
        <button type="button" (click)="plansP.set(null)">✕</button>
      </div>
      <div class="space-y-3">
        @for(plan of plansP()!.plans;track plan.id;let i=$index){
          <div class="border border-slate-200 rounded-xl p-4">
            <div class="flex justify-between items-center mb-3">
              <span class="text-sm font-bold text-primary">{{plan.durationMonths}} Months</span>
              <label class="flex items-center gap-1.5 text-xs cursor-pointer"><input type="checkbox" [(ngModel)]="planEs[i].isActive" class="accent-primary"/>Active</label>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-[11px] font-semibold text-muted block mb-1">Advance (Rs)</label>
                <input type="number" [(ngModel)]="planEs[i].advanceAmount" [name]="'adv'+i" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-primary"/></div>
              <div><label class="text-[11px] font-semibold text-muted block mb-1">Monthly (Rs)</label>
                <input type="number" [(ngModel)]="planEs[i].monthlyAmount" [name]="'mo'+i" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-primary"/></div>
            </div>
            <div class="mt-1.5 text-xs text-muted">Total: <strong class="text-ink tabular-nums">{{planTotal(i)}}</strong></div>
          </div>
        }
        <div class="border-2 border-dashed border-slate-200 rounded-xl p-4">
          <p class="text-xs font-bold text-muted uppercase mb-3">Add New Plan</p>
          <div class="grid grid-cols-3 gap-2">
            <div><label class="text-[11px] text-muted block mb-1">Months</label>
              <select [(ngModel)]="newPlanD" class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white">
                <option [value]="3">3</option><option [value]="6">6</option><option [value]="9">9</option><option [value]="12">12</option>
              </select></div>
            <div><label class="text-[11px] text-muted block mb-1">Advance</label>
              <input type="number" [(ngModel)]="newPlanAdv" class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm tabular-nums"/></div>
            <div><label class="text-[11px] text-muted block mb-1">Monthly</label>
              <input type="number" [(ngModel)]="newPlanMo" class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm tabular-nums"/></div>
          </div>
          <button type="button" (click)="addPlan()" class="mt-3 w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">+ Add Plan</button>
        </div>
        @if(mErr()){<div class="bg-red-50 text-red-600 text-xs p-2.5 rounded-xl">{{mErr()}}</div>}
        <div class="flex gap-2">
          <button type="button" (click)="savePlans()" [disabled]="mSaving()" class="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50">{{mSaving()?'Saving...':'Save Plans'}}</button>
          <button type="button" (click)="plansP.set(null)" class="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">Cancel</button>
        </div>
      </div>
    </div>
  </div>
}

<!-- Category Modal -->
@if(showCatModal){
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="showCatModal=false">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" (click)="$event.stopPropagation()">
      <div class="flex justify-between items-center mb-5">
        <h3 class="text-lg font-heading font-bold">{{catEditObj.id?'Edit':'Add'}} Category</h3>
        <button type="button" (click)="showCatModal=false">✕</button>
      </div>
      <div class="space-y-3">
        <div><label class="text-xs font-semibold text-muted block mb-1">Name *</label>
          <input type="text" [(ngModel)]="catEditObj.name" (ngModelChange)="catEditObj.id||autoSlug()" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        <div><label class="text-xs font-semibold text-muted block mb-1">Slug *</label>
          <input type="text" [(ngModel)]="catEditObj.slug" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary font-mono"/></div>
        <div><label class="text-xs font-semibold text-muted block mb-1">Image URL (ImgBB/Google Drive)</label>
          <input type="url" [(ngModel)]="catEditObj.imageUrl" placeholder="https://i.ibb.co/..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/>
          @if(catEditObj.imageUrl){<img [src]="toDirectUrl(catEditObj.imageUrl)" alt="preview" class="mt-2 w-16 h-16 rounded-full object-cover border-2 border-slate-200"/>}
        </div>
        <div><label class="text-xs font-semibold text-muted block mb-1">Description</label>
          <input type="text" [(ngModel)]="catEditObj.description" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"/></div>
        <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" [(ngModel)]="catEditObj.isActive" class="accent-primary"/>Active (show on website)</label>
        <div class="flex gap-2 pt-2">
          <button type="button" (click)="saveCat()" class="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm">Save</button>
          <button type="button" (click)="showCatModal=false" class="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold">Cancel</button>
        </div>
      </div>
    </div>
  </div>
}
  `,
})
export class AdminDashboardComponent {
  private h  = inject(HttpClient);
  private r  = inject(Router);
  private t  = inject(ToastService);
  readonly auth = inject(AuthService);
  readonly fmt  = formatPkr;

  readonly tabGroups = [
    { label: 'Dashboard',  tabs: [{ id:'summary'      as Tab, icon:'📊', label:'Overview'      }, { id:'reports'      as Tab, icon:'📈', label:'Reports'      }] },
    { label: 'Operations', tabs: [{ id:'orders'       as Tab, icon:'🛒', label:'Orders'        }, { id:'installments' as Tab, icon:'📅', label:'Installments'  }, { id:'payments'     as Tab, icon:'💳', label:'Payments'     }, { id:'payouts'      as Tab, icon:'💸', label:'Payouts'      }] },
    { label: 'Content',    tabs: [{ id:'banners'      as Tab, icon:'🎯', label:'Banners'       }, { id:'products'     as Tab, icon:'📦', label:'Products'      }, { id:'categories'   as Tab, icon:'🗂️', label:'Categories'   }, { id:'blog'         as Tab, icon:'📝', label:'Blog'          }] },
    { label: 'People',     tabs: [{ id:'users'        as Tab, icon:'👥', label:'Users'         }, { id:'vendors'      as Tab, icon:'🏪', label:'Vendors'       }, { id:'kyc'          as Tab, icon:'🪪', label:'KYC'          }] },
    { label: 'System',     tabs: [{ id:'audit'        as Tab, icon:'📋', label:'Audit Log'     }] },
  ];

  tab   = signal<Tab>('summary');
  currentTabLabel() { for (const g of this.tabGroups) { const t = g.tabs.find(t => t.id === this.tab()); if (t) return t.label; } return ''; }

  // Data
  summary   = signal<any>(null);
  orders    = signal<any[]>([]);
  installments = signal<any[]>([]);
  prods     = signal<PEdit[]>([]);
  filteredP = signal<PEdit[]>([]);
  cats      = signal<any[]>([]);
  brands    = signal<any[]>([]);
  usrs      = signal<any[]>([]);
  vends     = signal<any[]>([]);
  kycQ      = signal<any[]>([]);
  payO      = signal<any[]>([]);
  payR      = signal<any[]>([]);
  auditL    = signal<any[]>([]);
  report    = signal<any>(null);

  selUser   = signal<any>(null);
  pendingCount = () => this.orders().filter(o => o.status === 'PENDING').length;

  // Banner state — loaded from database
  heroBanners  = signal<any[]>(this.defaultBanners('hero'));
  offerBanners = signal<any[]>(this.defaultBanners('offer'));

  // Blog state
  blogPosts = signal<any[]>([]);
  blogCats  = signal<any[]>([]);
  blogEdit  = signal<any>(null);
  blogIsAdd = signal(false);
  blogF: { id:string; title:string; slug:string; categoryId:string; excerpt:string; content:string; coverImageUrl:string; metaTitle:string; metaDescription:string; isPublished:boolean } =
    { id:'', title:'', slug:'', categoryId:'', excerpt:'', content:'', coverImageUrl:'', metaTitle:'', metaDescription:'', isPublished:false };

  // Modal signals
  editP    = signal<PEdit|null>(null);
  imgP     = signal<PEdit|null>(null);
  plansP   = signal<PEdit|null>(null);
  payMod   = signal<any>(null);
  mSaving  = signal(false);
  mErr     = signal<string|null>(null);
  isAdd    = signal(false);

  // Form state
  pF  = { id:'',name:'',cashPrice:0,stock:50,categoryId:'',brandId:'',shortDescription:'',description:'',imageUrl:'' };
  planEs: Array<{advanceAmount:number;monthlyAmount:number;markupPercentage:number;isActive:boolean}> = [];
  newPlanD=3; newPlanAdv=0; newPlanMo=0;
  newImgUrl=''; newImgPrimary=false;
  payAmt=0; payInstNo=0; payNote=''; payScreenshot='';
  pSearch=''; pStatus=''; uQuery=''; orderFilter='';
  filtP() { return this.filteredP(); }
  showCatModal=false;
  catEditObj: any = {};

  constructor() { this.loadS(); this.loadOrders(); this.loadInstallments(); this.loadReport(); }

  switchTab(t: Tab) {
    this.tab.set(t); this.selUser.set(null); this.mErr.set(null);
    const m: Partial<Record<Tab,()=>void>> = {
      summary: ()=>this.loadS(), orders: ()=>this.loadOrders(),
      installments: ()=>this.loadInstallments(), banners: ()=>{this.ensureProds();this.loadBanners();},
      blog: ()=>this.loadBlog(),
      products: ()=>this.loadProds(), categories: ()=>this.loadCats(),
      users: ()=>this.loadU(), vendors: ()=>this.loadV(),
      kyc: ()=>this.loadKyc(), payouts: ()=>this.loadPayouts(),
      payments: ()=>this.loadPayments(), reports: ()=>this.loadReport(),
      audit: ()=>this.h.get<any[]>('/admin/audit-log').subscribe(d=>this.auditL.set(d)),
    };
    m[t]?.();
  }

  // Loaders
  loadS() { this.h.get('/admin/summary').subscribe(s=>this.summary.set(s)); }
  loadOrders() { const q=this.orderFilter?`?status=${this.orderFilter}`:''; this.h.get<any[]>(`/admin/installment-requests${q}`).subscribe(d=>this.orders.set(d)); }
  loadInstallments() {
    Promise.all([
      this.h.get<any[]>('/admin/installment-requests?status=ACTIVE').toPromise().catch(()=>[]),
      this.h.get<any[]>('/admin/installment-requests?status=APPROVED').toPromise().catch(()=>[]),
    ]).then(([active,approved])=>{
      const all=[...(active??[]),...(approved??[])];
      this.installments.set(all);
      if(this.selUser()){ const u=all.find((r:any)=>r.id===this.selUser().id); if(u) this.selUser.set(u); }
    });
  }
  ensureProds() { if(!this.prods().length) this.loadProds(); }
  loadProds() {
    if(!this.cats().length) this.h.get<any[]>('/admin/categories').subscribe(d=>this.cats.set(d));
    if(!this.brands().length) this.h.get<any[]>('/brands').subscribe(d=>this.brands.set(d));
    this.h.get<any[]>('/admin/products').subscribe(list=>{
      const full=(list??[]).map((p:any)=>({...p,plans:p.plans??[],images:p.images??[]}));
      this.prods.set(full); this.filteredP.set(full);
    });
  }
  loadCats() { this.h.get<any[]>('/admin/categories').subscribe(d=>this.cats.set(d)); }
  loadU(q='') { this.h.get<any[]>(q?`/admin/users?q=${encodeURIComponent(q)}`:'/admin/users').subscribe(d=>this.usrs.set(d)); }
  loadV() { this.h.get<any[]>('/admin/vendors').subscribe(d=>this.vends.set(d)); }
  loadKyc() { this.h.get<any[]>('/admin/kyc').subscribe(d=>this.kycQ.set(d)); }
  loadPayouts() { this.h.get<any[]>('/admin/payouts').subscribe(d=>this.payO.set(d)); }
  loadPayments() { this.h.get<any[]>('/admin/payments/pending-review').subscribe(d=>this.payR.set(d)); }
  loadReport() { this.h.get<any>('/admin/reports/sales').subscribe(d=>this.report.set(d)); }

  // Summary cards
  summaryCards(s: any) {
    return [
      { icon:'👥', label:'Total Users',    value:s.users?.total??0,                primary:false, tab:'users'        as Tab },
      { icon:'📦', label:'Products',       value:s.products?.total??0,             primary:false, tab:'products'     as Tab },
      { icon:'🛒', label:'Pending Orders', value:s.installments?.pending??0,       primary:false, badge:(s.installments?.pending??0)>0?'Action needed':undefined, badgeClass:'bg-amber-100 text-amber-700', tab:'orders' as Tab },
      { icon:'📅', label:'Active Plans',   value:s.installments?.active??0,        primary:true,  tab:'installments' as Tab },
      { icon:'💳', label:'Payments Review',value:s.payments?.pendingReview??0,     primary:false, tab:'payments'     as Tab },
      { icon:'🏪', label:'Pending Vendors',value:s.vendors?.pendingApproval??0,    primary:false, tab:'vendors'      as Tab },
      { icon:'🪪', label:'KYC Pending',    value:s.kyc?.pending??0,               primary:false, tab:'kyc'          as Tab },
      { icon:'💰', label:'Today Revenue',  value:this.fmt(s.payments?.todayTotal), primary:true  },
    ];
  }

  // Calculations — FIXED
  calcPaid(req: any): string    { return this.fmt(this.calcPN(req).toFixed(2)); }
  calcPN(req: any): number      { return (req.schedules??[]).filter((s:any)=>s.status==='PAID').reduce((sum:number,s:any)=>sum+Number(s.paidAmount??s.amount),0); }
  calcRemStr(req: any): string  { const rem=(req.schedules??[]).filter((s:any)=>s.status!=='PAID').reduce((s:number,x:any)=>s+Number(x.amount),0); return this.fmt(rem.toFixed(2)); }
  calcPct(req: any): number {
    const s = req.schedules ?? [];
    if (!s.length) return req.status === 'APPROVED' ? 0 : 0;
    return Math.round((s.filter((x: any) => x.status === 'PAID').length / s.length) * 100);
  }
  calcPaidN(req: any): number { return (req.schedules ?? []).filter((s: any) => s.status === 'PAID').length; }
  totalInstN(req: any): number {
    if (req.schedules?.length) return req.schedules.length;
    return Number(req.installmentPlan?.durationMonths ?? 0);
  }
  hasOverdue(req: any): boolean { return (req.schedules ?? []).some((s: any) => s.status === 'OVERDUE'); }
  isAdvancePending(req: any): boolean { return req.status === 'APPROVED' && !(req.schedules?.length); }
  totalVal() { return this.installments().reduce((s,r)=>s+Number(r.installmentPlan?.totalPayable??0),0); }
  totalCol() { return this.installments().reduce((s,r)=>s+this.calcPN(r),0); }
  totalRem() { return this.totalVal()-this.totalCol(); }

  // Orders
  approveOrder(id:string) { this.h.post(`/admin/installment-requests/${id}/approve`,{}).subscribe({next:()=>{this.loadOrders();this.t.success('Approved ✅');},error:(e)=>alert(e?.error?.message??'Failed')}); }
  rejectOrder(id:string)  { const r=prompt('Reason:'); if(r===null)return; this.h.post(`/admin/installment-requests/${id}/reject`,{reason:r}).subscribe({next:()=>{this.loadOrders();this.t.info('Rejected');},error:(e)=>alert(e?.error?.message??'Failed')}); }
  openPayModal(req: any) {
    this.payMod.set(req);
    this.mErr.set(null);
    this.payNote = '';
    this.payScreenshot = '';

    // Check if advance is paid (installment #0 or first schedule)
    const schedules = req.schedules ?? [];
    const advancePaid = schedules.some((s: any) => s.installmentNo === 0 && s.status === 'PAID')
      || req.status === 'ACTIVE'; // If ACTIVE, advance already paid

    if (!advancePaid && req.status === 'APPROVED') {
      // First payment = advance
      this.payInstNo = 0;
      this.payAmt = Number(req.installmentPlan?.advanceAmount ?? 0);
      this.payNote = 'Advance payment';
    } else {
      // Regular monthly installment
      const nextPending = schedules.find((s: any) => s.status === 'PENDING' || s.status === 'OVERDUE');
      this.payInstNo = nextPending?.installmentNo ?? 0;
      this.payAmt = Number(nextPending?.amount ?? req.installmentPlan?.monthlyAmount ?? 0);
      this.payNote = '';
    }
  }
  submitPay() {
    const req=this.payMod(); if(!req)return;
    this.mSaving.set(true); this.mErr.set(null);
    const ss=this.payScreenshot?.trim()?this.toDirectUrl(this.payScreenshot.trim()):undefined;
    this.h.post(`/admin/installment-requests/${req.id}/record-payment`,{amount:this.payAmt,note:this.payNote||undefined,installmentNo:this.payInstNo||undefined,screenshotUrl:ss}).subscribe({
      next:(r:any)=>{this.mSaving.set(false);this.payMod.set(null);this.loadOrders();this.loadInstallments();this.t.success(r.allPaid?'🎉 All paid!':'Payment recorded!');},
      error:(e:any)=>{this.mSaving.set(false);this.mErr.set(e?.error?.message??'Failed');},
    });
  }
  quickPay(req:any,n:number) {
    const s=req.schedules?.find((x:any)=>x.installmentNo===n);
    const amt=Number(s?.amount??req.installmentPlan?.monthlyAmount??0);
    this.h.post(`/admin/installment-requests/${req.id}/record-payment`,{amount:amt,installmentNo:n,note:'Admin'}).subscribe({
      next:()=>{this.t.success('Paid ✓');this.loadInstallments();this.loadOrders();},
      error:(e:any)=>alert(e?.error?.message??'Failed'),
    });
  }

  // Products
  filterP() {
    const q=this.pSearch.toLowerCase(); const st=this.pStatus;
    this.filteredP.set(this.prods().filter(p=>(!q||p.name.toLowerCase().includes(q)||p.category.slug.includes(q)||(p.brand?.name?.toLowerCase().includes(q)??false))&&(!st||p.status===st)));
  }
  searchU() { this.loadU(this.uQuery); }
  openAdd() { this.isAdd.set(true); this.pF={id:'',name:'',cashPrice:0,stock:50,categoryId:'',brandId:'',shortDescription:'',description:'',imageUrl:''}; this.mErr.set(null); this.editP.set({} as any); }
  openEdit(p:PEdit) { this.isAdd.set(false); this.pF={id:p.id,name:p.name,cashPrice:Number(p.cashPrice),stock:p.stock,categoryId:p.category.id??'',brandId:p.brand?.id??'',shortDescription:p.shortDescription??'',description:'',imageUrl:''}; this.mErr.set(null); this.editP.set(p); }
  openImg(p:PEdit)  { this.newImgUrl=''; this.newImgPrimary=p.images.length===0; this.mErr.set(null); this.imgP.set(p); }
  openPlans(p:PEdit){ this.planEs=p.plans.map(pl=>({advanceAmount:Number(pl.advanceAmount),monthlyAmount:Number(pl.monthlyAmount),markupPercentage:Number(pl.markupPercentage),isActive:pl.isActive})); this.newPlanD=3;this.newPlanAdv=0;this.newPlanMo=0; this.mErr.set(null); this.plansP.set(p); }

  saveP() {
    this.mSaving.set(true); this.mErr.set(null);
    if(this.isAdd()){
      const imgUrl=this.pF.imageUrl?.trim();
      const body:any={name:this.pF.name.trim(),categoryId:this.pF.categoryId,cashPrice:Number(this.pF.cashPrice),stock:Number(this.pF.stock),description:this.pF.description?.trim()||`${this.pF.name} available on easy installments.`,shortDescription:this.pF.shortDescription?.trim()||undefined};
      if(this.pF.brandId) body.brandId=this.pF.brandId;
      if(imgUrl) body.images=[{publicId:`admin/${Date.now()}`,url:this.toDirectUrl(imgUrl),alt:this.pF.name,isPrimary:true}];
      this.h.post('/vendor/products',body).subscribe({
        next:(c:any)=>{
          const cp=Number(this.pF.cashPrice);
          const plans=[{durationMonths:3,advancePct:.30,mp:5},{durationMonths:6,advancePct:.25,mp:10},{durationMonths:12,advancePct:.20,mp:18}]
            .map(({durationMonths,advancePct,mp})=>{const ma=Math.round(cp*mp/100);const total=cp+ma;const adv=Math.round(total*advancePct);const mo=Math.round((total-adv)/durationMonths);return{durationMonths,advanceAmount:adv,monthlyAmount:mo,markupPercentage:mp,markupAmount:ma};});
          Promise.all(plans.map(pl=>this.h.post(`/vendor/products/${c.id}/plans`,pl).toPromise().catch(()=>null)))
            .then(()=>this.h.post(`/vendor/products/${c.id}/publish`,{}).toPromise().catch(()=>null))
            .finally(()=>{this.mSaving.set(false);this.t.success('Product added!');this.editP.set(null);this.loadProds();});
        },
        error:(e:any)=>{this.mSaving.set(false);this.mErr.set(Array.isArray(e?.error?.message)?e.error.message.join(', '):(e?.error?.message??'Failed'));},
      });
    }else{
      const body:any={name:this.pF.name.trim(),cashPrice:Number(this.pF.cashPrice),stock:Number(this.pF.stock)};
      if(this.pF.shortDescription?.trim()) body.shortDescription=this.pF.shortDescription.trim();
      if(this.pF.description?.trim()) body.description=this.pF.description.trim();
      const oldP=this.editP()!;
      const newPrice=Number(this.pF.cashPrice);
      const oldPrice=Number(oldP?.cashPrice??newPrice);
      this.h.patch(`/vendor/products/${this.pF.id}`,body).subscribe({
        next:()=>{
          // Auto-recalculate plans if price changed
          if(Math.abs(newPrice-oldPrice)>1&&oldP?.plans?.length){
            const planReqs=oldP.plans.map((plan:any)=>{
              const mp=Number(plan.markupPercentage??10);
              const ma=Math.round(newPrice*mp/100);
              const total=newPrice+ma;
              const advPct=Number(plan.advanceAmount)/(oldPrice*(1+mp/100))||0.25;
              const adv=Math.round(total*Math.min(Math.max(advPct,0.1),0.5));
              const mo=Math.round((total-adv)/plan.durationMonths);
              return this.h.patch(`/vendor/products/${this.pF.id}/plans/${plan.id}`,{advanceAmount:adv,monthlyAmount:mo,markupPercentage:mp,markupAmount:ma}).toPromise().catch(()=>null);
            });
            Promise.all(planReqs).then(()=>{this.mSaving.set(false);this.t.success('Saved! Plans auto-updated ✅');this.editP.set(null);this.loadProds();});
          }else{
            this.mSaving.set(false);this.t.success('Saved!');this.editP.set(null);this.loadProds();
          }
        },
        error:(e:any)=>{this.mSaving.set(false);this.mErr.set(e?.error?.message??'Failed');},
      });
    }
  }

  addImg() {
    const p=this.imgP(); if(!p)return;
    this.mSaving.set(true); this.mErr.set(null);
    this.h.post(`/admin/products/${p.id}/add-image`,{imageUrl:this.toDirectUrl(this.newImgUrl.trim()),isPrimary:this.newImgPrimary}).subscribe({
      next:()=>{this.mSaving.set(false);this.newImgUrl='';this.t.success('Image added!');this.loadProds();setTimeout(()=>{const u=this.prods().find((x:any)=>x.id===p.id);if(u)this.imgP.set(u);},800);},
      error:(e:any)=>{this.mSaving.set(false);this.mErr.set(e?.error?.message??'Failed');},
    });
  }
  delImg(id:string) {
    if(!confirm('Delete?'))return;
    this.h.delete(`/admin/images/${id}`).subscribe({
      next:()=>{this.t.success('Deleted');const p=this.imgP();this.loadProds();if(p)setTimeout(()=>{const u=this.prods().find((x:any)=>x.id===p.id);if(u)this.imgP.set(u);},800);},
      error:(e:any)=>alert(e?.error?.message??'Failed'),
    });
  }

  savePlans() {
    const p=this.plansP(); if(!p)return;
    this.mSaving.set(true); this.mErr.set(null);
    const cp=Number(p.cashPrice);
    const reqs=p.plans.map((plan,i)=>{const e=this.planEs[i];const total=Number(e.advanceAmount)+(Number(e.monthlyAmount)*plan.durationMonths);const ma=Math.max(0,total-cp);return this.h.patch(`/vendor/products/${p.id}/plans/${plan.id}`,{advanceAmount:Number(e.advanceAmount),monthlyAmount:Number(e.monthlyAmount),markupPercentage:Number(((ma/cp)*100).toFixed(2)),markupAmount:Number(ma.toFixed(2)),isActive:e.isActive}).toPromise().catch(()=>null);});
    Promise.all(reqs).then(()=>{this.mSaving.set(false);this.t.success('Plans saved!');this.plansP.set(null);this.loadProds();});
  }
  addPlan() {
    const p=this.plansP(); if(!p)return;
    this.mSaving.set(true); this.mErr.set(null);
    const cp=Number(p.cashPrice);const adv=this.newPlanAdv;const mo=this.newPlanMo;const dur=this.newPlanD;
    const total=adv+(mo*dur);const ma=Math.max(0,total-cp);
    this.h.post(`/vendor/products/${p.id}/plans`,{durationMonths:dur,advanceAmount:adv,monthlyAmount:mo,markupPercentage:Number(((ma/cp)*100).toFixed(2)),markupAmount:Number(ma.toFixed(2))}).subscribe({
      next:()=>{this.mSaving.set(false);this.t.success('Plan added!');this.loadProds();setTimeout(()=>{const u=this.prods().find((x:any)=>x.id===p.id);if(u)this.openPlans(u);},800);},
      error:(e:any)=>{this.mSaving.set(false);this.mErr.set(Array.isArray(e?.error?.message)?e.error.message.join(', '):(e?.error?.message??'Failed'));},
    });
  }
  planTotal(i:number):string { const p=this.plansP();if(!p)return'—';const e=this.planEs[i];return this.fmt((Number(e.advanceAmount)+(Number(e.monthlyAmount)*p.plans[i].durationMonths)).toFixed(2)); }
  togPublish(p:PEdit) {
    if(p.status==='PUBLISHED') this.h.patch(`/vendor/products/${p.id}`,{status:'DRAFT'}).subscribe(()=>this.loadProds());
    else this.h.post(`/vendor/products/${p.id}/publish`,{}).subscribe({next:()=>this.loadProds(),error:(e:any)=>alert(e?.error?.message??'Add at least 1 active plan first')});
  }
  delProd(p:PEdit) { if(!confirm(`Delete "${p.name}"?`))return; this.h.delete(`/vendor/products/${p.id}`).subscribe({next:()=>this.loadProds(),error:(e:any)=>alert(e?.error?.message??'Failed')}); }

  // Categories
  editCat(c: any) { this.catEditObj={id:c.id,name:c.name,slug:c.slug,imageUrl:c.imageUrl||'',description:c.description||'',isActive:c.isActive}; this.showCatModal=true; }
  autoSlug() { this.catEditObj.slug=this.catEditObj.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  saveCat() {
    if(this.catEditObj.id){
      this.h.patch(`/admin/categories/${this.catEditObj.id}`,{name:this.catEditObj.name,imageUrl:this.toDirectUrl(this.catEditObj.imageUrl||''),description:this.catEditObj.description,isActive:this.catEditObj.isActive}).subscribe({
        next:()=>{this.t.success('Category saved!');this.showCatModal=false;this.loadCats();},
        error:(e:any)=>alert(e?.error?.message??'Failed'),
      });
    }else{
      this.h.post('/admin/categories',{name:this.catEditObj.name,slug:this.catEditObj.slug,imageUrl:this.toDirectUrl(this.catEditObj.imageUrl||''),description:this.catEditObj.description}).subscribe({
        next:()=>{this.t.success('Category created!');this.showCatModal=false;this.loadCats();},
        error:(e:any)=>alert(Array.isArray(e?.error?.message)?e.error.message.join(', '):(e?.error?.message??'Failed')),
      });
    }
  }
  delCat(id:string,name:string) {
    if(!confirm(`Delete category "${name}"? All products must be moved first.`))return;
    this.h.delete(`/admin/categories/${id}`).subscribe({next:()=>{this.t.success('Deleted');this.loadCats();},error:(e:any)=>alert(e?.error?.message??'Failed')});
  }

  // Banner management — backed by /admin/banners (Postgres), not localStorage
  defaultBanners(type:'hero'|'offer'):any[] {
    if(type==='hero') return [1,2,3].map(i=>({id:`hero-${i}`,type:'hero',position:i,isActive:i===1,badge:i===1?'🔥 Best Seller':i===2?'🏍️ Top Pick':'💻 New Arrival',headline:'',subtitle:'',ctaText:'Buy Now',ctaLink:'',imageUrl:'',bgColor:'#2346A0'}));
    return [1,2,3].map(i=>({id:`offer-${i}`,type:'offer',position:i,isActive:true,badge:'Special Offer',headline:'',subtitle:'',ctaLink:'',imageUrl:'',bgColor:'#17307A',advance:'',monthly:'',months:6,total:''}));
  }
  loadBanners() {
    this.h.get<{hero:any[];offer:any[]}>('/admin/banners').subscribe({
      next: (res) => {
        const merge = (type:'hero'|'offer', rows:any[]) => {
          const defaults = this.defaultBanners(type);
          return defaults.map((d,i) => {
            const saved = rows.find(r => r.position === i+1);
            return saved ? { ...d, ...saved, type } : d;
          });
        };
        this.heroBanners.set(merge('hero', res.hero ?? []));
        this.offerBanners.set(merge('offer', res.offer ?? []));
      },
      error: () => this.t.error('Failed to load banners', 'Try again'),
    });
  }
saveBanner(sl: any) {
  const dto = {
    id: sl.id,
    type: sl.type.toUpperCase(),
    position: sl.position,
    isActive: sl.isActive,

    badge: sl.badge,
    headline: sl.headline,
    subtitle: sl.subtitle,

    ctaText: sl.ctaText,
    ctaLink: sl.ctaLink,

    imageUrl: sl.imageUrl,
    bgColor: sl.bgColor,

    advance: sl.advance,
    monthly: sl.monthly,
    months: sl.months,
    total: sl.total
  };

  this.h.put('/admin/banners', dto).subscribe({
    next: () => {
      this.t.success(
        'Banner saved! ✅',
        'Homepage updated for everyone'
      );
    },
    error: (e: any) =>
      this.t.error(
        e?.error?.message ?? 'Failed to save banner',
        'Try again'
      ),
  });
}

  // Blog management
  loadBlog() {
    this.h.get<any[]>('/admin/blog').subscribe(d=>this.blogPosts.set(d));
    if(!this.blogCats().length) this.h.get<any[]>('/blog/categories').subscribe(d=>this.blogCats.set(d));
  }
  resetBlogForm() {
    this.blogF = { id:'', title:'', slug:'', categoryId:'', excerpt:'', content:'', coverImageUrl:'', metaTitle:'', metaDescription:'', isPublished:false };
  }
  openBlogAdd() {
    this.resetBlogForm();
    this.blogIsAdd.set(true);
    this.mErr.set(null);
    this.blogEdit.set({});
  }
  openBlogEdit(b:any) {
    this.blogF = {
      id: b.id, title: b.title, slug: b.slug, categoryId: b.categoryId ?? '',
      excerpt: b.excerpt, content: b.content, coverImageUrl: b.coverImageUrl ?? '',
      metaTitle: b.metaTitle ?? '', metaDescription: b.metaDescription ?? '', isPublished: b.isPublished,
    };
    this.blogIsAdd.set(false);
    this.mErr.set(null);
    this.blogEdit.set(b);
  }
  saveBlogPost() {
    this.mSaving.set(true);
    this.mErr.set(null);
    const body = {
      title: this.blogF.title,
      slug: this.blogF.slug || undefined,
      categoryId: this.blogF.categoryId || undefined,
      excerpt: this.blogF.excerpt,
      content: this.blogF.content,
      coverImageUrl: this.blogF.coverImageUrl || undefined,
      metaTitle: this.blogF.metaTitle || undefined,
      metaDescription: this.blogF.metaDescription || undefined,
      isPublished: this.blogF.isPublished,
    };
    const req$ = this.blogIsAdd()
      ? this.h.post('/admin/blog', body)
      : this.h.patch(`/admin/blog/${this.blogF.id}`, body);
    req$.subscribe({
      next: () => {
        this.mSaving.set(false);
        this.blogEdit.set(null);
        this.t.success('Blog post saved! ✅');
        this.loadBlog();
      },
      error: (e:any) => {
        this.mSaving.set(false);
        this.mErr.set(e?.error?.message ?? 'Failed to save post');
      },
    });
  }
  toggleBlogPublish(b:any) {
    this.h.patch(`/admin/blog/${b.id}`, { isPublished: !b.isPublished }).subscribe({
      next: () => { this.t.success(b.isPublished ? 'Post unpublished' : 'Post published! 🎉'); this.loadBlog(); },
      error: (e:any) => this.t.error(e?.error?.message ?? 'Failed to update', 'Try again'),
    });
  }
  deleteBlogPost(b:any) {
    if(!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    this.h.delete(`/admin/blog/${b.id}`).subscribe({
      next: () => { this.t.success('Post deleted'); this.loadBlog(); },
      error: (e:any) => this.t.error(e?.error?.message ?? 'Failed to delete', 'Try again'),
    });
  }
  autoFill(sl:any) {
    const slug=sl.ctaLink.replace('/product/','');
    const p=this.prods().find(x=>x.slug===slug);
    if(p){ sl.headline=p.name; if(p.plans.length){const pl=p.plans[0];sl.advance=this.fmt(pl.advanceAmount);sl.monthly=this.fmt(pl.monthlyAmount);sl.months=pl.durationMonths;sl.total=this.fmt(pl.totalPayable);sl.subtitle=`Starting from ${this.fmt(pl.monthlyAmount)}/month`;} }
  }

  // Helpers
  toDirectUrl(url:string):string {
    if(!url) return url;
    const gd=url.match(/drive\.google\.com\/file\/d\/([^/?]+)/); if(gd) return `https://drive.google.com/thumbnail?id=${gd[1]}&sz=w600`;
    const gd2=url.match(/drive\.google\.com\/open\?id=([^&]+)/); if(gd2) return `https://drive.google.com/thumbnail?id=${gd2[1]}&sz=w600`;
    if(url.includes('dropbox.com')) return url.replace('dl=0','dl=1').replace('www.dropbox.com','dl.dropboxusercontent.com');
    return url;
  }
  fmtDate(iso:string):string { try{return new Date(iso).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});}catch{return iso||'—';} }
  logout() { this.auth.logout().subscribe({complete:()=>this.r.navigate(['/']),error:()=>this.r.navigate(['/']),}); }
  runReminders() { this.h.post<any>('/admin/cron/reminders/run-now',{}).subscribe(r=>this.t.success(`Reminders run! Pre: ${r.preReminders??0}, Overdue: ${r.overdueMarked??0}`)); }
  approveVend(id:string) { this.h.post(`/admin/vendors/${id}/approve`,{}).subscribe(()=>this.loadV()); }
  suspVend(id:string) { const r=prompt('Reason:');if(!r)return; this.h.post(`/admin/vendors/${id}/suspend`,{reason:r}).subscribe(()=>this.loadV()); }
  reviewKyc(id:string,approve:boolean) { const r=approve?undefined:(prompt('Reason:')||undefined); this.h.post(`/admin/kyc/${id}/review`,{approve,reason:r}).subscribe(()=>this.loadKyc()); }
  approvePay(id:string) { this.h.post(`/admin/payouts/${id}/approve`,{}).subscribe(()=>this.loadPayouts()); }
  markPaid(id:string) { this.h.post(`/admin/payouts/${id}/mark-paid`,{}).subscribe(()=>this.loadPayouts()); }
  reviewPay(id:string,d:'APPROVE'|'REJECT') { this.h.post(`/admin/payments/${id}/review`,{decision:d}).subscribe(()=>this.loadPayments()); }
}
