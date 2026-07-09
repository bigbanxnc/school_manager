import React, { useState } from 'react';
import { angularCodeFiles } from '../../angular-code-data';

const h = React.createElement;

export default function SourceCodeExplorer() {
  const [selectedFilePath, setSelectedFilePath] = useState(angularCodeFiles[0].path);

  const selectedFile = angularCodeFiles.find(f => f.path === selectedFilePath) || angularCodeFiles[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    alert(`Đã sao chép mã nguồn của file: ${selectedFile.name}`);
  };

  return h('main', {
    className: 'workspace-content',
    style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' },
    id: 'source_explorer_workspace'
  },
    h('div', { className: 'workspace-header' },
      h('div', null,
        h('h1', { id: 'source_explorer_title' }, '📁 Mã Nguồn Angular Dự Án (Mô Phỏng)'),
        h('p', { style: { fontSize: '0.85rem', color: '#8E8E85', marginTop: '4px', fontFamily: 'sans-serif' } },
          'Cấu trúc mã nguồn Angular của hệ thống. Bạn có thể copy trực tiếp mã nguồn này để tích hợp vào ứng dụng Angular thật.'
        )
      )
    ),

    h('div', { className: 'code-explorer-container', style: { flex: 1 }, id: 'angular_code_explorer_box' },
      h('div', { className: 'code-sidebar' },
        h('div', { className: 'sidebar-header' }, '📂 Angular Files'),
        h('div', { className: 'file-list', id: 'explorer_file_list' },
          angularCodeFiles.map(file =>
            h('div', {
              key: file.path,
              className: `file-item ${selectedFile.path === file.path ? 'active' : ''}`,
              onClick: () => setSelectedFilePath(file.path)
            },
              h('span', null, selectedFile.path === file.path ? '📖 ' : '📄 '),
              file.name,
              h('span', { className: 'badge-lang' }, file.language)
            )
          )
        )
      ),

      h('div', { className: 'code-viewer-panel' },
        h('div', { className: 'viewer-header' },
          h('span', { className: 'file-path', id: 'explorer_file_path' }, selectedFile.path),
          h('button', {
            className: 'btn btn-secondary btn-sm',
            onClick: handleCopyCode,
            id: 'btn_copy_code'
          }, '📋 Sao chép mã nguồn')
        ),
        h('div', { className: 'code-body' },
          h('pre', null,
            h('code', { id: 'explorer_code_content' }, selectedFile.content)
          )
        )
      )
    )
  );
}
