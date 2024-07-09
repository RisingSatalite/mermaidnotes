'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const Mermaid = dynamic(() => import('@/components/mermaid'), { ssr: false });

export default function Editor() {
  const [mermaidChart, setMermaidChart] = useState(`sequenceDiagram
    Alice ->> Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!
    Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.

    Bob-->Alice: Checking with John...
    Alice->John: Yes... John, how are you?
  `);
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const arrowTypes = ["->>", "-->>", "--x", "-x", "->", "-->"];
  const [arrowList, setArrowList] = useState([]);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [toItem, setToItem] = useState(null);
  const [selectedArrow, setSelectedArrow] = useState([]);
  const [arrowText, setArrowText] = useState('');

  const change = (e) => {
    setMermaidChart(e.target.value);
  };

  const addItem = () => {
    if (inputValue.trim()) {
      setItems([...items, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    setItems(reorderedItems);
  };

  const addArrow = () => {
    if (selectedItem && toItem && arrowText.trim()) {
      setArrowList([...arrowList, { item: selectedItem, item2: toItem, text: arrowText.trim() }]);
      setArrowText('');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default newline behavior

      const { selectionStart, selectionEnd, value } = event.target;
      const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(currentLineStart, selectionStart);
      const leadingSpaces = currentLine.match(/^\s*/)[0];

      const newValue = 
        value.substring(0, selectionStart) + '\n' + leadingSpaces + value.substring(selectionEnd);

      setMermaidChart(newValue);

      // Move the cursor to the new position
      setTimeout(() => {
        event.target.selectionStart = event.target.selectionEnd = selectionStart + leadingSpaces.length + 1;
      }, 0);
    }
  };

  const downloadFile = (filename, content) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };
  
  const handleExport = () => {
    downloadFile('sequencediagram.txt', mermaidChart);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      try {
        const importedData = content;
        setMermaidChart(importedData);
      } catch (error) {
        console.error('Error parsing imported data:', error);
        alert('An error occurred while reading the data');
      }
    };
  
    reader.readAsText(file);
  };  
  
  return (
    <main>
      <div>
        <button onClick={handleExport}>Export Data</button>
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="fileInput"
        />
        <button onClick={() => document.getElementById('fileInput').click()}>Import Data</button>
      </div>
      <div className="full flex justify-center">
        <span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <button onClick={addItem}>Add Item</button>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={items.map((item, index) => item + index)}>
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{ listStyle: 'none', padding: 0 }}
                >
                  {items.map((item, index) => (
                    <Draggable key={item + index} draggableId={item + index} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            padding: '8px',
                            margin: '0 0 8px 0',
                            backgroundColor: '#000',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                          }}
                        >
                          {item}
                          <button onClick={() => removeItem(index)}>Remove</button>
                          <button onClick={() => setSelectedItem(item)}>Select</button>
                          <button onClick={() => setToItem(item)}>Select</button>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>

          {selectedItem && (
            <div>
              <h3>Add Text for: {selectedItem}</h3>
              <input
                type="text"
                value={arrowText}
                onChange={(e) => setArrowText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addArrow()}
              />
              <button onClick={addArrow}>Add Text</button>
            </div>
          )}

          <h2>Second List</h2>
          <ul>
            {arrowList.map((item, index) => (
              <li key={index}>
                {item.item}:{item.item2}:{item.text}
              </li>
            ))}
          </ul>
        </span>
      </div>
    </main>
  );
}
