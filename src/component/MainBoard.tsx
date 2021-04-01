import React, { useState, useEffect, MutableRefObject } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { addConnectionAction } from '@/store/node/actions';
import { openCPAction } from '@/store/panel/actions';
import { Content, ConnectionType } from '@/store/node/types';
import Base, { Handler as BaseHandler } from './Base';
import ControllPanel from './ControllPanel';
import Connection, { Handler as ConnectionHandler } from './Connection';
import { getIndex } from '@/utils';
import { add, subtract } from '@/utils/vector';
import useIdRef from '@/utils/manageIdRef';
import style from '@/style/MainBoard.css';

const MainBoard: React.FC = () => {
  const props = useSelector((state: RootState) => state.nodeReducer);
  const cpIdsList = useSelector((state: RootState) => state.panelReducer.cpIdsList);
  const connections = useSelector((state: RootState) => state.nodeReducer.connections);
  const baseIdRefs = useIdRef<BaseHandler>(props.contents);
  const connectionIdRefs = useIdRef<ConnectionHandler>(connections); const [cpIndexes, setCPIndexes] = useState<number[]>([]);

  const dispatch = useDispatch();
  const openCPFunc = (id: number) => dispatch(openCPAction(id));
  const addConnection = (c: ConnectionType) => dispatch(addConnectionAction(c));

  // controlPanel系
  const createOpenCP = (id: number) => {
    const openCP = () => {
      const currentIndex = cpIdsList[0].indexOf(id);
      if (currentIndex === -1) {
        openCPFunc(id);
        createSetCPIndex(0)(cpIdsList[0].length);
      } else if (currentIndex !== cpIndexes[0]){
        createSetCPIndex(0)(currentIndex);
      }
    }
    return openCP;
  }
  const createSetCPIndex = (cpIndex: number) => {
    const setCPIndex = (newIndex: number) => {setCPIndexes( cpIndexes.map( (oldIndex, i) => i === cpIndex ? newIndex : oldIndex ))}
    return setCPIndex
  }

  useEffect(()=>{
    for (const i in cpIdsList) {
      if (cpIndexes[i] === undefined) {
        return setCPIndexes([...cpIndexes, 0]);
      }
    }
  }, [cpIdsList]);

  const basePosChange = (base: MutableRefObject<BaseHandler>, id: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = base.current.getPos();
    const s = {x: e.clientX, y: e.clientY };
    const ics: ConnectionInfo[] = [], ocs: ConnectionInfo[] = [];
    connections.forEach(c=>{
      if (c.iBaseId==id) ics.push({...c, ref: connectionIdRefs[getIndex(connectionIdRefs, c.id)].ref});
      if (c.oBaseId==id) ocs.push({...c, ref: connectionIdRefs[getIndex(connectionIdRefs, c.id)].ref});
    });
    const mousemove = (e: MouseEvent) => {
      const eClient = { x: e.clientX, y: e.clientY, };
      const diff = subtract(eClient, s);
      base.current.updatePosStyle(add(diff, pos));
      ics.forEach(ic=>{
        const { start, end } = ic.ref.current.getPos();
        ic.ref.current.changeView(start, add(end, diff));
      });
      ocs.forEach(oc=>{
        const { start, end } = oc.ref.current.getPos();
        oc.ref.current.changeView(add(start, diff), end);
      });
    }
    const mouseup = (e: MouseEvent) => {
      const eClient = { x: e.clientX, y: e.clientY, };
      const diff = subtract(eClient, s);
      base.current.updatePosState(add(diff, pos));
      ics.forEach(ic=>{
        const { start, end } = ic.ref.current.getPos();
        ic.ref.current.setPos(start, add(end, diff));
      });
      ocs.forEach(oc=>{
        const { start, end } = oc.ref.current.getPos();
        oc.ref.current.setPos(add(start, diff), end);
      });
      window.removeEventListener('mousemove', mousemove);
      window.removeEventListener('mouseup', mouseup);
    }
    window.addEventListener('mousemove', mousemove);
    window.addEventListener('mouseup', mouseup);
  }

  return (
    <div className={style.mainBoard}>
      {baseIdRefs.map((baseIdRef)=>{
        const c = props.contents.filter(c=>c.id === baseIdRef.id)[0];
        if (c===undefined) return null;
        const baseProps = {
          property: c, 
          openCP: createOpenCP(c.id),
          posChange: basePosChange(baseIdRef.ref, c.id),
          key: c.id,
        }
        return <Base ref={baseIdRef.ref} {...baseProps}/>
      })}
      {cpIdsList.map((ids: number[], i)=>{
        if(ids[0]===undefined) return;
        let properties: Content[] = [];
        ids.forEach(id=>{
          let c = props.contents.filter(c=>c.id===id)[0];
          properties.push(c);
        })
        const cpProps = { 
          properties: properties, 
          index: cpIndexes[i],
          setIndex: createSetCPIndex(i),
        }
        return <ControllPanel {...cpProps} key={i}/>
      })}
      <svg className={style.connectionPanel}>
        {connections.map((c, i)=>{
          const cProps = { type: c.type, curving: props.curving, s: c.s, e: c.e, };
          return <Connection key={i} {...cProps}/>;
        })}
      </svg>
    </div>
  )
}

export default MainBoard;

type ConnectionInfo = ConnectionType & { ref: MutableRefObject<ConnectionHandler>; };
