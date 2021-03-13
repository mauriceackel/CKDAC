import React, { ReactElement, useEffect, useRef } from 'react';
import 'jsoneditor-react/es/editor.min.css';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { JsonEditor: Editor } = require('jsoneditor-react');

interface JsonEditorProps {
  value: any;
  onChange?: (data: any) => void;
  readonly?: boolean;
}
function JsonEditor(props: JsonEditorProps): ReactElement {
  const { value, onChange = () => {}, readonly = false } = props;
  const editorRef = useRef<any>(null);

  useEffect(() => {
    editorRef.current?.jsonEditor?.set(value);
  }, [value]);

  return (
    <Editor
      ref={editorRef}
      onChange={onChange}
      mode={readonly ? 'view' : 'text'}
      allowedMode={[readonly ? 'view' : 'text']}
      navigationBar={false}
      statusBar={false}
      mainMenuBar={false}
    />
  );
}

export default JsonEditor;
