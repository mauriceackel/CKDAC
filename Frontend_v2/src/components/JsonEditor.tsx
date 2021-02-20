import React, { ReactElement, useEffect, useRef } from 'react';
import 'jsoneditor-react/es/editor.min.css';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { JsonEditor: Editor } = require('jsoneditor-react');

interface JsonEditorProps {
  value: any;
  onChange: (data: any) => void;
}
function JsonEditor({ value, onChange }: JsonEditorProps): ReactElement {
  const editorRef = useRef<any>(null);

  useEffect(() => {
    editorRef.current?.jsonEditor?.set(value);
  }, [value]);

  return (
    <Editor
      ref={editorRef}
      value={{ foo: 'bar' }}
      onChange={onChange}
      mode="text"
      allowedMode={['text']}
      navigationBar={false}
      statusBar={false}
      mainMenuBar={false}
    />
  );
}

export default JsonEditor;
