import { describe, expect, it } from 'vitest';
import { DragController, type DropEvent, type Rect } from './controller';

function setup() {
  const rects = new Map<Element, Rect>();
  const drops: DropEvent[] = [];
  const said: string[] = [];
  const controller = new DragController({
    onDrop: (event) => drops.push(event),
    announce: (message) => said.push(message),
    rectOf: (el) => rects.get(el) ?? { left: 0, top: 0, width: 0, height: 0 },
  });
  const item = document.createElement('div');
  const a = document.createElement('div');
  const b = document.createElement('div');
  const c = document.createElement('div');
  rects.set(item, { left: 0, top: 0, width: 50, height: 50 });
  rects.set(a, { left: 200, top: 0, width: 100, height: 100 });
  rects.set(b, { left: 400, top: 0, width: 100, height: 100 });
  rects.set(c, { left: 600, top: 0, width: 100, height: 100 });
  controller.registerItem({ id: 'piece', el: item, label: 'Potongan sepertiga' });
  controller.registerTarget({ id: 'a', el: a, label: 'Kotak A', accepts: () => true });
  controller.registerTarget({ id: 'b', el: b, label: 'Kotak B', accepts: () => true });
  controller.registerTarget({ id: 'c', el: c, label: 'Kotak C', accepts: (id) => id !== 'piece' });
  return { controller, drops, said, item, a, b, c };
}

const P1 = 1;
const P2 = 2;

describe('pointer drag', () => {
  it('drops on the target under the pointer', () => {
    const { controller, drops, item } = setup();
    expect(controller.start('piece', { pointerId: P1, clientX: 25, clientY: 25 })).toBe(true);
    controller.move({ pointerId: P1, clientX: 250, clientY: 50 });
    controller.end({ pointerId: P1, clientX: 250, clientY: 50 });
    expect(drops).toEqual([{ itemId: 'piece', targetId: 'a' }]);
    expect((item as HTMLElement).style.transform).toBe('');
    expect(controller.isDragging()).toBe(false);
  });

  it('snaps to a target within the snap radius', () => {
    const { controller, drops } = setup();
    controller.start('piece', { pointerId: P1, clientX: 25, clientY: 25 });
    controller.end({ pointerId: P1, clientX: 170, clientY: 50 });
    expect(drops).toEqual([{ itemId: 'piece', targetId: 'a' }]);
  });

  it('returns home when dropped far from every target', () => {
    const { controller, drops, item } = setup();
    controller.start('piece', { pointerId: P1, clientX: 25, clientY: 25 });
    controller.move({ pointerId: P1, clientX: 100, clientY: 300 });
    controller.end({ pointerId: P1, clientX: 100, clientY: 300 });
    expect(drops).toEqual([]);
    expect((item as HTMLElement).style.transform).toBe('');
  });

  it('ignores targets that do not accept the item', () => {
    const { controller, drops } = setup();
    controller.start('piece', { pointerId: P1, clientX: 25, clientY: 25 });
    controller.end({ pointerId: P1, clientX: 650, clientY: 50 });
    expect(drops).toEqual([]);
  });

  it('moves the item by the pointer delta', () => {
    const { controller, item } = setup();
    controller.start('piece', { pointerId: P1, clientX: 10, clientY: 10 });
    controller.move({ pointerId: P1, clientX: 40, clientY: 50 });
    expect((item as HTMLElement).style.transform).toBe('translate(30px, 40px)');
  });

  it('marks the hovered target and clears it after the drop', () => {
    const { controller, a, item } = setup();
    controller.start('piece', { pointerId: P1, clientX: 25, clientY: 25 });
    expect(item.hasAttribute('data-dragging')).toBe(true);
    controller.move({ pointerId: P1, clientX: 250, clientY: 50 });
    expect(a.hasAttribute('data-drop-hover')).toBe(true);
    controller.end({ pointerId: P1, clientX: 250, clientY: 50 });
    expect(a.hasAttribute('data-drop-hover')).toBe(false);
    expect(item.hasAttribute('data-dragging')).toBe(false);
  });

  it('ignores a second finger while a drag is active', () => {
    const { controller, drops, item } = setup();
    controller.start('piece', { pointerId: P1, clientX: 10, clientY: 10 });
    expect(controller.start('piece', { pointerId: P2, clientX: 0, clientY: 0 })).toBe(false);
    controller.move({ pointerId: P2, clientX: 500, clientY: 500 });
    expect((item as HTMLElement).style.transform).toBe('');
    controller.end({ pointerId: P2, clientX: 250, clientY: 50 });
    expect(drops).toEqual([]);
    controller.end({ pointerId: P1, clientX: 250, clientY: 50 });
    expect(drops).toEqual([{ itemId: 'piece', targetId: 'a' }]);
  });

  it('pointercancel sends the item home without dropping', () => {
    const { controller, drops, item } = setup();
    controller.start('piece', { pointerId: P1, clientX: 10, clientY: 10 });
    controller.move({ pointerId: P1, clientX: 250, clientY: 50 });
    controller.cancelPointer({ pointerId: P1, clientX: 250, clientY: 50 });
    expect(drops).toEqual([]);
    expect((item as HTMLElement).style.transform).toBe('');
    expect(controller.isDragging()).toBe(false);
  });

  it('refuses to start an unknown item', () => {
    const { controller } = setup();
    expect(controller.start('nope', { pointerId: P1, clientX: 0, clientY: 0 })).toBe(false);
  });

  it('forgets unregistered targets', () => {
    const rects = new Map<Element, Rect>();
    const drops: DropEvent[] = [];
    const controller = new DragController({ onDrop: (e) => drops.push(e), rectOf: (el) => rects.get(el)! });
    const item = document.createElement('div');
    const target = document.createElement('div');
    rects.set(item, { left: 0, top: 0, width: 10, height: 10 });
    rects.set(target, { left: 0, top: 0, width: 100, height: 100 });
    controller.registerItem({ id: 'x', el: item, label: 'x' });
    const unregister = controller.registerTarget({ id: 't', el: target, label: 't', accepts: () => true });
    unregister();
    controller.start('x', { pointerId: P1, clientX: 5, clientY: 5 });
    controller.end({ pointerId: P1, clientX: 50, clientY: 50 });
    expect(drops).toEqual([]);
  });
});

describe('keyboard drag', () => {
  it('picks up, cycles through accepting targets, and drops', () => {
    const { controller, drops, said, a, b } = setup();
    expect(controller.keyDown('piece', ' ')).toBe(true);
    expect(said.at(-1)).toContain('Diangkat: Potongan sepertiga');
    expect(said.at(-1)).toContain('Kotak A');
    expect(a.hasAttribute('data-drop-hover')).toBe(true);
    controller.keyDown('piece', 'ArrowRight');
    expect(b.hasAttribute('data-drop-hover')).toBe(true);
    expect(said.at(-1)).toBe('Kotak B');
    controller.keyDown('piece', 'ArrowRight');
    expect(a.hasAttribute('data-drop-hover')).toBe(true);
    controller.keyDown('piece', 'ArrowLeft');
    expect(b.hasAttribute('data-drop-hover')).toBe(true);
    controller.keyDown('piece', 'Enter');
    expect(drops).toEqual([{ itemId: 'piece', targetId: 'b' }]);
    expect(said.at(-1)).toBe('Potongan sepertiga ditaruh di Kotak B.');
    expect(controller.isDragging()).toBe(false);
  });

  it('Escape cancels', () => {
    const { controller, drops, said } = setup();
    controller.keyDown('piece', ' ');
    controller.keyDown('piece', 'Escape');
    expect(drops).toEqual([]);
    expect(said.at(-1)).toBe('Batal.');
    expect(controller.isDragging()).toBe(false);
  });

  it('says so when nothing accepts the item', () => {
    const said: string[] = [];
    const controller = new DragController({ onDrop: () => {}, announce: (m) => said.push(m) });
    controller.registerItem({ id: 'x', el: document.createElement('div'), label: 'Kartu' });
    expect(controller.keyDown('x', ' ')).toBe(true);
    expect(said.at(-1)).toBe('Tidak ada tempat untuk Kartu.');
    expect(controller.isDragging()).toBe(false);
  });

  it('leaves unrelated keys alone', () => {
    const { controller } = setup();
    expect(controller.keyDown('piece', 'a')).toBe(false);
    controller.keyDown('piece', ' ');
    expect(controller.keyDown('piece', 'a')).toBe(false);
  });

  it('does not start a keyboard drag during a pointer drag', () => {
    const { controller } = setup();
    controller.start('piece', { pointerId: P1, clientX: 0, clientY: 0 });
    expect(controller.keyDown('piece', ' ')).toBe(false);
  });
});

describe('svg scale', () => {
  it('divides the pointer delta by the svg screen scale', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    svg.append(rect);
    svg.getScreenCTM = () => ({ a: 2, d: 2 }) as DOMMatrix;
    const controller = new DragController({ onDrop: () => {}, rectOf: () => ({ left: 0, top: 0, width: 0, height: 0 }) });
    controller.registerItem({ id: 'r', el: rect, label: 'r' });
    controller.start('r', { pointerId: P1, clientX: 0, clientY: 0 });
    controller.move({ pointerId: P1, clientX: 40, clientY: 20 });
    expect((rect as unknown as SVGElement).style.transform).toBe('translate(20px, 10px)');
  });
});

describe('return home transition', () => {
  function missed(reducedMotion: () => boolean) {
    const item = document.createElement('div');
    const controller = new DragController({ onDrop: () => {}, reducedMotion, rectOf: () => ({ left: 0, top: 0, width: 0, height: 0 }) });
    controller.registerItem({ id: 'x', el: item, label: 'x' });
    controller.start('x', { pointerId: P1, clientX: 0, clientY: 0 });
    controller.move({ pointerId: P1, clientX: 300, clientY: 300 });
    controller.end({ pointerId: P1, clientX: 300, clientY: 300 });
    return item.style.transition;
  }

  it('animates the return when motion is allowed', () => {
    expect(missed(() => false)).toContain('200ms');
  });

  it('skips the animation under reduced motion', () => {
    expect(missed(() => true)).not.toContain('200ms');
  });

  it('defaults safely when matchMedia is missing', () => {
    expect(() => {
      const controller = new DragController({ onDrop: () => {} });
      controller.registerItem({ id: 'x', el: document.createElement('div'), label: 'x' });
      controller.start('x', { pointerId: P1, clientX: 0, clientY: 0 });
      controller.cancelPointer({ pointerId: P1, clientX: 0, clientY: 0 });
    }).not.toThrow();
  });
});

describe('cancelItem', () => {
  it('cancels a pointer drag without dropping', () => {
    const { controller, drops, item } = setup();
    controller.start('piece', { pointerId: P1, clientX: 10, clientY: 10 });
    controller.move({ pointerId: P1, clientX: 250, clientY: 50 });
    controller.cancelItem('piece');
    expect(controller.isDragging()).toBe(false);
    expect(drops).toEqual([]);
    expect((item as HTMLElement).style.transform).toBe('');
  });

  it('cancels a keyboard drag and clears the hover', () => {
    const { controller, drops, a, item } = setup();
    controller.keyDown('piece', ' ');
    expect(a.hasAttribute('data-drop-hover')).toBe(true);
    controller.cancelItem('piece');
    expect(controller.isDragging()).toBe(false);
    expect(drops).toEqual([]);
    expect(a.hasAttribute('data-drop-hover')).toBe(false);
    expect(item.hasAttribute('data-dragging')).toBe(false);
  });

  it('does nothing for a different item', () => {
    const { controller } = setup();
    controller.keyDown('piece', ' ');
    controller.cancelItem('other');
    expect(controller.isDragging()).toBe(true);
  });

  it('does nothing when idle', () => {
    const { controller } = setup();
    expect(() => controller.cancelItem('piece')).not.toThrow();
    expect(controller.isDragging()).toBe(false);
  });
});

describe('targeting', () => {
  it('drops at exactly the snap radius and not beyond', () => {
    const inside = setup();
    inside.controller.start('piece', { pointerId: P1, clientX: 0, clientY: 0 });
    inside.controller.end({ pointerId: P1, clientX: 152, clientY: 50 });
    expect(inside.drops).toEqual([{ itemId: 'piece', targetId: 'a' }]);

    const outside = setup();
    outside.controller.start('piece', { pointerId: P1, clientX: 0, clientY: 0 });
    outside.controller.end({ pointerId: P1, clientX: 151, clientY: 50 });
    expect(outside.drops).toEqual([]);
  });

  it('snaps to the nearer of two targets', () => {
    const { controller, drops } = setup();
    controller.start('piece', { pointerId: P1, clientX: 0, clientY: 0 });
    controller.end({ pointerId: P1, clientX: 330, clientY: 50 });
    expect(drops).toEqual([{ itemId: 'piece', targetId: 'a' }]);

    const other = setup();
    other.controller.start('piece', { pointerId: P1, clientX: 0, clientY: 0 });
    other.controller.end({ pointerId: P1, clientX: 370, clientY: 50 });
    expect(other.drops).toEqual([{ itemId: 'piece', targetId: 'b' }]);
  });

  it('Escape clears the hover and dragging marks', () => {
    const { controller, a, item } = setup();
    controller.keyDown('piece', ' ');
    expect(a.hasAttribute('data-drop-hover')).toBe(true);
    expect(item.hasAttribute('data-dragging')).toBe(true);
    controller.keyDown('piece', 'Escape');
    expect(a.hasAttribute('data-drop-hover')).toBe(false);
    expect(item.hasAttribute('data-dragging')).toBe(false);
  });
});
