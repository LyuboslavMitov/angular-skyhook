import { Input, Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { DndService, DragPreviewOptions, DragSourceSpec } from 'angular-hovercraft';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-trash',
  template: `
    <ng-container *ngIf="collected$|async as coll">
      <p>
        <button (click)="litter($event)">add more</button> <span>({{remain}} left)</span>
      </p>
      <div class="trash pad" [class.empty]="remain == 0 || coll.isDragging && remain == 1"
        [dragSource]="trashSource">

        <!--<div class="handle" [dragSource]="trashSource">handle</div>-->
        <span class="type">{{ type }}</span>
      </div>
    </ng-container>
  `,
  styles: [`
    .trash { background: #ffccff; width: 100px; }
    .empty { background: #eee; }
    .empty .type { visibility: hidden; }
    .handle { background: #ccf; cursor: move; }
    .hide { visibility: hidden; }
  `]
})
export class Trash implements OnInit, OnDestroy {
  type: string;
  @Input('type') set itemType(t: string) {
    this.type = t;
    this.trashSource.setType(t);
  }
  remain = 3;
  count = 0;

  destroy = new Subscription();

  trashSource = this.dnd.dragSource(null, {
    canDrag: (monitor) => this.remain > 0,
    beginDrag: (monitor) => {
      // the return value here is the 'item' that's in-flight
      // think of it like
      // interface WrappedItem { type: "TRASH"; item: { count: number; } }
      // later, monitor.getItemType() gives you type;
      // and    monitor.getItem() gives you item.
      return { count: this.count++ };
    },
    endDrag: (monitor) => {
      console.log(monitor.getItem());
      if (monitor.didDrop()) {
        this.remain--;
        // you might fire an action here
        // monitor.getDropResult() gives you { ...target.drop(), dropEffect: 'move'|'copy'|'link'|'none' }
        // so if you returned { abc: 123 } from target.drop(), you would get { dropEffect: 'move', abc: 123 }
        console.log(monitor.getDropResult());
      }
    }
  }, this.destroy);

  // listen will apply distinctUntilChanged(===) on scalars and most types
  isDragging$ = this.trashSource.listen(m => m.isDragging());
  // it will also apply distinctUntilChanged(shallowEqual) on { objects }
  collected$ = this.trashSource.listen(monitor => ({
    isDragging: monitor.isDragging(),
    canDrag: monitor.canDrag(),
    itemType: monitor.getItemType()
  }));

  // use this with

  // <ng-container *ngIf="collected$|async as coll">
  //   {{coll.itemType || 'not dragging' }}
  //   more content
  // </ng-container>

  // the technique saves doing multiple |async subscriptions and is cleaner
  // but will ultimately mean more frequent, less granular change detection
  // if you care about performance, test both {}-style and scalar-style
  // subscriptions. it all depends on which monitor queries you're listening for.

  constructor(private dnd: DndService) { }

  ngOnInit() {
    // const img = new Image();
    // img.onload = () => this.trashSource.connector().dragPreview(img);
    // // could easily be a data:// uri
    // img.src = 'https://angular.io/assets/images/logos/angular/angular.png';
  }

  ngOnChanges() {
  }

  ngOnDestroy() {
    this.destroy.unsubscribe();
  }

  litter() {
    this.remain += 5;
  }

}