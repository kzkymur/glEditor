import React, { MutableRefObject } from 'react';
import { BaseType, ConnectionType } from '@/store/node/types';
import { Handler as ConnectionHandler } from '@/component/Connection';
import { Handler as BaseHandler, Props as BaseProps } from '@/component/Base';
import { add, subtract } from '@/utils/vector';

class Props {
  #base: BaseType & { ref: MutableRefObject<BaseHandler>; };
  #in: ConnectionInfo[]; 
  #out: ConnectionInfo[];
  #openCP: (id:number)=>void;
  #isSizeChanging: boolean = true;
  #tcr: MutableRefObject<ConnectionHandler>;
  #newConnectionInfo?: NewConnectionInfo;
  readonly property: BaseType;

  constructor ( base: BaseType & { ref: MutableRefObject<BaseHandler>; },
    inputConnections: ConnectionInfo[],
    outputConnections: ConnectionInfo[],
    openCP: (id:number)=>void,
    temporalConnectionRef: MutableRefObject<ConnectionHandler>,
  ) {
    this.#base = base;
    this.property = base;
    this.#in = inputConnections;
    this.#out = outputConnections;
    this.#openCP = openCP;
    this.#tcr = temporalConnectionRef;
  }

  posChange: (e: React.MouseEvent<HTMLDivElement>) => void = e => {
    this.#isSizeChanging = false;
    const pos = this.#base.ref.current.getPos();
    const s = {x: e.clientX, y: e.clientY };
    const mousemove = (e: MouseEvent) => {
      const eClient = { x: e.clientX, y: e.clientY, };
      const diff = subtract(eClient, s);
      this.#base.ref.current.updatePosStyle(add(diff, pos));
      this.#in.forEach(ic=>{ ic.ref.current.changeViewWithDiff(false, diff); });
      this.#out.forEach(oc=>{ oc.ref.current.changeViewWithDiff(true, diff); });
    }
    const mouseup = (e: MouseEvent) => {
      const eClient = { x: e.clientX, y: e.clientY, };
      const diff = subtract(eClient, s);
      if (this.#base.ref.current.updatePosState(add(diff, pos))) {
        this.#in.forEach(ic=>{ ic.ref.current.setPosWithDiff(false, diff)});
        this.#out.forEach(oc=>{ oc.ref.current.setPosWithDiff(true, diff)});
      } else {
        this.#openCP(this.#base.id);
      }
      window.removeEventListener('mousemove', mousemove);
      window.removeEventListener('mouseup', mouseup);
      this.#isSizeChanging = true;
    }
    window.addEventListener('mousemove', mousemove);
    window.addEventListener('mouseup', mouseup);
  }
  sizeChange: (e: React.MouseEvent<HTMLDivElement>) => void = e => {
    if (!this.#isSizeChanging) return;
    const s = {x: e.clientX, y: e.clientY };
    const mousemove = (e: MouseEvent) => {
      const eClient = { x: e.clientX, y: e.clientY, };
      const diff = subtract(eClient, s);
      this.#base.ref.current.updateSizeStyle();
      this.#in.forEach(ic=>{ ic.ref.current.changeViewWithDiff(false, {x: 0, y: diff.y}); });
      this.#out.forEach(oc=>{ oc.ref.current.changeViewWithDiff(true, diff); });
    }
    const mouseup = (e: MouseEvent) => {
      const eClient = { x: e.clientX, y: e.clientY, };
      const diff = subtract(eClient, s);
      if (this.#base.ref.current.updateSizeState()) {
        this.#in.forEach(ic=>{ ic.ref.current.setPosWithDiff(false, {x: 0, y: diff.y})});
        this.#out.forEach(oc=>{ oc.ref.current.setPosWithDiff(true, diff)});
      }
      window.removeEventListener('mousemove', mousemove);
      window.removeEventListener('mouseup', mouseup);
    }
    window.addEventListener('mousemove', mousemove);
    window.addEventListener('mouseup', mouseup);
  }

  operateNewConnection: (isInput: boolean, id: number) => () => void = (isInput, id) => () => {
    const s = this.#base.ref.current.getJointPos(isInput, id);
    const mousemove = (e: MouseEvent) => {
      const eClient = { x: e.clientX, y: e.clientY, };
      if (isInput) this.#tcr.current.changeView(eClient, s);
      else this.#tcr.current.changeView(s, eClient);
    }
    const mouseup = () => {
      const zeroV = { x: 0, y:0 };
      this.#tcr.current.changeView(zeroV, zeroV);
      window.removeEventListener('mousemove', mousemove);
      window.addEventListener('mouseup', mouseup);
    }
    window.addEventListener('mousemove', mousemove);
    window.addEventListener('mouseup', mouseup);
  }
  registerNewConnection: (isInput: boolean, id: number) => () => void = (isInput, id) => () => {
  }
}

export default function baseProps (
  base: BaseType & { ref: MutableRefObject<BaseHandler>; },
  inputConnections: ConnectionInfo[],
  outputConnections: ConnectionInfo[],
  openCP: (id:number)=>void,
  temporalConnectionRef: MutableRefObject<ConnectionHandler>,
): BaseProps {
  const obj = new Props(base, inputConnections, outputConnections, openCP, temporalConnectionRef);
  return { ...obj };
}

type ConnectionInfo = ConnectionType & { ref: MutableRefObject<ConnectionHandler>; };
type NewConnectionInfo = {
  isInput: boolean;
  baseId: number;
  id: number;
};
