'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const Mermaid = dynamic(() => import('@/components/mermaid'), { ssr: false });

export default function Editor() {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState('');

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

  const downloadFile = (filename, content) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };
  
  const handleExport = () => {
    let text = ""
    //console.log(items)
    for (let note of items) {
      text += note + ",";
      //console.log(note);
    }
    //Remove trailing comma
    if (text.endsWith(",")) {
      text = text.slice(0, -1);
    }
    downloadFile('MermaidNotes.txt', text);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      try {
        const importedData = content;
        console.log(content)
        for(let i in importedData.split(",")){
          console.log(i)
        }
        setItems(importedData.split(","))
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
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </span>
      </div>
    </main>
  );
}
