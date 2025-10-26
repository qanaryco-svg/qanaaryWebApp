declare module 'react-quill' {
  import * as React from 'react';
  
  export interface ReactQuillProps {
    value?: string;
    onChange?: (content: string) => void;
    theme?: string;
    modules?: any;
    formats?: string[];
    [key: string]: any;
  }

  export default class ReactQuill extends React.Component<ReactQuillProps> {}
}