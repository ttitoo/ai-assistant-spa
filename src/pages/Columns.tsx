import { ReactNode, useEffect, useState } from 'react';
import classNames from 'classnames';
import {
  addIndex,
  applySpec,
  compose,
  curry,
  head,
  equals,
  map,
  keys,
  prop,
  propOr,
  flip,
  mergeLeft,
  path,
  isNil,
  __,
  isEmpty,
  unless,
  any,
  ifElse,
  pathOr
} from 'ramda';
import { useSelector } from 'react-redux';
import AddIcon from '@mui/icons-material/Add';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import Breadcrumb from '../components/Breadcrumb';
import Loadable from '../components/Loadable';
import Table from '../components/Columns/Table';
import Form from '../components/Columns/Form';
import Detail from '../components/Columns/Detail';
import SampleForm from '../components/Columns/SampleForm';
import { ColumnDetail } from '../interfaces';
// import styles from "./page.module.css";
import FloatingMenu from '../components/FloatingMenu';
import styled from 'styled-components';
import { isBlank } from '../utils/common';
import useSagaDispatch from '../hooks/useSagaDispatch';
import { ColumnsState } from '../store/reducers/columns';

const FitContentContainer = styled.div`
  height: fit-content;
`;

const IconContainer = styled.div`
  svg {
    font-size: 120px;
    color: #424242;
  }
`

const Columns = () => {
  const { dispatch, state } = useSagaDispatch<ColumnsState>('columns');
  const meta = useSelector(path(['app', 'meta']));
  const tables = useSelector(path(['app', 'tables']));
  const {
    loading,
    submitting,
    success,
    columnDetails: records,
    table: lastSelectedTable,
    column: lastSelectedColumn,
    selected
  } = state;
  const { columnDetail: columnDetailUid } = selected;
  const [editing, setEditing] = useState<ColumnDetail | undefined>(undefined);
  const [sampleFormVisible, setSampleFormVisible] = useState<
    string | undefined
  >(undefined);
  const [selectedTable, setSelectedTable] = useState<string | undefined>(
    lastSelectedTable
  );
  const [selectedColumn, setSelectedColumn] = useState<string | undefined>(
    lastSelectedColumn
  );

  useEffect(() => {
    unless(isEmpty, compose(setSelectedTable, head, keys))(tables);
  }, [tables]);

  useEffect(() => {
    if (!isNil(selectedTable) && !isNil(selectedColumn)) {
      dispatch('clearSelected');
      dispatch('list', { table: selectedTable, column: selectedColumn });
    }
  }, [selectedTable, selectedColumn]);

  useEffect(() => {
    if (!submitting) {
      isNil(editing) || setEditing(undefined);
      if (success) {
        isNil(sampleFormVisible) || setSampleFormVisible(undefined);
      }
    }
  }, [submitting]);

  const create = async (e: MouseEvent, record: ColumnDetail) => {
    e.preventDefault();
    const data = prop('data')(record);
    dispatch('create', { table: selectedTable, column: selectedColumn, data });
  };

  const changeColumn = (e: MouseEvent) => {
    e.preventDefault();

    compose(setSelectedColumn, path(['target', 'dataset', 'column']))(e);
  };

  const isSelectedColumn = equals(selectedColumn);
  const toColumnEntry = (columnName: string, index: number): ReactNode => (
    <button
      key={columnName}
      aria-current={`${isSelectedColumn(columnName)}`}
      type="button"
      data-column={columnName}
      className={classNames(
        'w-full px-4 py-2 font-medium text-left border-b border-gray-200 cursor-pointer focus:outline-none dark:bg-gray-800 dark:border-gray-600',
        applySpec({
          'text-white': isSelectedColumn,
          'bg-blue-700': isSelectedColumn
        })(columnName),
        {
          'rounded-t-lg': index === 0,
          'rounded-b-lg':
            keys(tables[selectedTable].columns).length - 1 === index
        }
      )}
      onClick={changeColumn}
    >
      {path([selectedTable, 'columns', columnName], tables)}
    </button>
  );

  const add = (e: MouseEvent) => {
    e.preventDefault();
    setEditing({
      uid: new Date().getTime()
    } as ColumnDetail);
  };

  const addFrom = (e: MouseEvent, record: ColumnDetail) => {
    e.preventDefault();
    compose(
      setEditing,
      mergeLeft<ColumnDetail>({ uid: new Date().getTime() } as ColumnDetail)
    )(record);
  };

  const changeTable = (e: MouseEvent<HTMLAnchorElement>, tableName: string) => {
    e.preventDefault();
    setSelectedTable(tableName);
    setSelectedColumn(undefined);
  };

  const toTableEntry = (tableName: string): ReactNode => (
    <button
      type="button"
      key={tableName}
      aria-selected={equals(selectedTable, tableName)}
      className={classNames(
        'inline-block p-4 border-b-2 rounded-t-lg',
        equals(selectedTable, tableName)
          ? 'active text-blue-600 border-blue-600 border-b-2'
          : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
      )}
      onClick={flip(changeTable)(tableName)}
    >
      {path([tableName, 'name'], tables)}
    </button>
  );
  const tableList = compose(map(toTableEntry), keys)(tables);
  const tableTabs = (
    <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
      <div className="flex flex-col">
        <div
          aria-label="Tabs with underline"
          role="tablist"
          className="flex text-center flex-wrap -mb-px border-b border-gray-200 dark:border-gray-700"
        >
          {tableList}
        </div>
      </div>
    </div>
  );

  const columnList = compose(
    addIndex(map)(toColumnEntry),
    keys,
    prop('columns'),
    curry(propOr)([])
  )(selectedTable, tables);

  const showSampleForm = (e: MouseEvent, uid: string) => {
    e.preventDefault();
    setSampleFormVisible(uid);
  };

  const closeSampleForm = (e: MouseEvent) => {
    e.preventDefault();
    setSampleFormVisible(undefined);
  };

  return (
    <div className="min-h-full">
      <div className="p-5 bg-white">
        <Breadcrumb items={[{ title: 'Columns', path: 'columns' }]} />
        {tableTabs}
        <div className="flex py-4">
          <FitContentContainer className="w-48 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            {columnList}
          </FitContentContainer>
          <div className="flex-1 ml-4 relative overflow-x-hidden">
            <Loadable loading={loading}>
              {ifElse(
                isBlank,
                () =>
                  any(isNil)([selectedTable, selectedColumn]) ? (
                    <div className="m-4 text-center">
                      <IconContainer>
                        <AnnouncementIcon fontSize="inherit" />
                      </IconContainer>
                      <p className="text-xl">
                        请选择左侧特征
                      </p>
                    </div>
                  ) : (
                    <div className="flow-root shadow-md sm:rounded-lg">
                      <Table
                        key="table"
                        table={selectedTable}
                        column={selectedColumn}
                        payloads={records}
                        addFrom={addFrom}
                        showSampleForm={showSampleForm}
                      />
                      <div
                        className={classNames('my-10', {
                          hidden: !isEmpty(records)
                        })}
                      >
                        暂无数据
                      </div>
                    </div>
                  ),
                () => (
                  <Detail
                    key="detail"
                    loading={loading}
                    table={selectedTable}
                    column={selectedColumn}
                    tables={tables}
                  />
                )
              )(columnDetailUid)}
            </Loadable>
          </div>
        </div>
      </div>
      <Form
        loading={submitting}
        table={selectedTable}
        column={selectedColumn}
        record={editing}
        create={create}
        close={() => setEditing(undefined)}
      />
      <SampleForm
        loading={submitting}
        meta={meta}
        columnDetailUid={sampleFormVisible}
        table={selectedTable}
        column={selectedColumn}
        close={closeSampleForm}
      />
      {any(isNil, [selectedTable, selectedColumn]) ||
        !isNil(columnDetailUid) || (
          <FloatingMenu handleClick={add} icon={AddIcon} />
        )}
    </div>
  );
};

export default Columns;
