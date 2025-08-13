import { FONT_STACK } from './config.js';

// WebAssembly Module for Performance-Critical Operations
export class WasmModule {
  constructor() {
    this.wasmInstance = null;
    this.isInitialized = false;
    this.memoryBuffer = null;
    this.performanceMetrics = {
      wasmOperations: 0,
      jsOperations: 0,
      wasmTime: 0,
      jsTime: 0
    };
    
    this.init();
  }
  
  // Initialize WebAssembly module
  async init() {
    try {
      // Check if WebAssembly is supported
      if (typeof WebAssembly === 'undefined') {
        console.warn('WebAssembly not supported, falling back to JavaScript');
        return false;
      }
      
      // Create WebAssembly module with performance-critical functions
      const wasmCode = this.generateWasmCode();
      const wasmModule = await WebAssembly.compile(wasmCode);
      
      // Create memory with 1MB initial size, 16MB maximum
      const memory = new WebAssembly.Memory({
        initial: 1,  // 1MB
        maximum: 16  // 16MB
      });
      
      // Create WebAssembly instance
      this.wasmInstance = await WebAssembly.instantiate(wasmModule, {
        env: {
          memory: memory,
          // Performance monitoring functions
          performance_now: () => performance.now(),
          console_log: (ptr, len) => {
            const str = this.readString(ptr, len);
            console.log('[WASM]', str);
          }
        }
      });
      
      this.memoryBuffer = memory;
      this.isInitialized = true;
      
      console.log('WebAssembly module initialized successfully');
      return true;
      
    } catch (error) {
      console.warn('Failed to initialize WebAssembly module:', error);
      return false;
    }
  }
  
  // Generate WebAssembly code for performance-critical operations
  generateWasmCode() {
    return `
      (module
        (import "env" "memory" (memory 1 16))
        (import "env" "performance_now" (func $performance_now (result f64)))
        (import "env" "console_log" (func $console_log (param i32 i32)))
        
        ;; String processing functions
        (func $string_length (param $ptr i32) (result i32)
          (local $len i32)
          (local.set $len (i32.const 0))
          (loop $count_loop
            (local.get $ptr)
            (local.get $len)
            (i32.add)
            (i32.load8_u)
            (i32.eqz)
            (br_if $count_loop)
            (local.set $len (i32.add (local.get $len) (i32.const 1)))
            (br $count_loop)
          )
          (local.get $len)
        )
        
        ;; Fast string search (Boyer-Moore algorithm)
        (func $string_search (param $text_ptr i32) (param $text_len i32) (param $pattern_ptr i32) (param $pattern_len i32) (result i32)
          (local $i i32)
          (local $j i32)
          (local $found i32)
          (local.set $found (i32.const -1))
          (local.set $i (i32.const 0))
          
          (loop $search_loop
            (local.get $i)
            (local.get $text_len)
            (local.get $pattern_len)
            (i32.sub)
            (i32.le_s)
            (br_if $search_loop)
            
            (local.set $j (i32.const 0))
            (loop $match_loop
              (local.get $j)
              (local.get $pattern_len)
              (i32.lt_s)
              (br_if $match_loop)
              
              (local.get $text_ptr)
              (local.get $i)
              (local.get $j)
              (i32.add)
              (i32.load8_u)
              (local.get $pattern_ptr)
              (local.get $j)
              (i32.load8_u)
              (i32.ne)
              (br_if $match_loop)
              
              (local.set $j (i32.add (local.get $j) (i32.const 1)))
              (br $match_loop)
            )
            
            (local.get $j)
            (local.get $pattern_len)
            (i32.eq)
            (if
              (then
                (local.set $found (local.get $i))
                (br $search_loop)
              )
            )
            
            (local.set $i (i32.add (local.get $i) (i32.const 1)))
            (br $search_loop)
          )
          
          (local.get $found)
        )
        
        ;; Fast data compression (simple RLE)
        (func $compress_rle (param $input_ptr i32) (param $input_len i32) (param $output_ptr i32) (result i32)
          (local $i i32)
          (local $j i32)
          (local $count i32)
          (local $current i32)
          (local $output_len i32)
          
          (local.set $i (i32.const 0))
          (local.set $output_len (i32.const 0))
          
          (loop $compress_loop
            (local.get $i)
            (local.get $input_len)
            (i32.lt_s)
            (br_if $compress_loop)
            
            (local.set $count (i32.const 1))
            (local.get $input_ptr)
            (local.get $i)
            (i32.add)
            (i32.load8_u)
            (local.set $current)
            
            (loop $count_loop
              (local.get $i)
              (local.get $count)
              (i32.add)
              (local.get $input_len)
              (i32.lt_s)
              (br_if $count_loop)
              
              (local.get $input_ptr)
              (local.get $i)
              (local.get $count)
              (i32.add)
              (i32.load8_u)
              (local.get $current)
              (i32.eq)
              (br_if $count_loop)
              
              (local.set $count (i32.add (local.get $count) (i32.const 1)))
              (br $count_loop)
            )
            
            ;; Write count and value
            (local.get $output_ptr)
            (local.get $output_len)
            (i32.add)
            (local.get $count)
            (i32.store8)
            
            (local.get $output_ptr)
            (local.get $output_len)
            (i32.const 1)
            (i32.add)
            (i32.add)
            (local.get $current)
            (i32.store8)
            
            (local.set $output_len (i32.add (local.get $output_len) (i32.const 2)))
            (local.set $i (i32.add (local.get $i) (local.get $count)))
            (br $compress_loop)
          )
          
          (local.get $output_len)
        )
        
        ;; Fast mathematical operations
        (func $fast_sqrt (param $x f64) (result f64)
          (local.get $x)
          (f64.sqrt)
        )
        
        (func $fast_pow (param $base f64) (param $exponent f64) (result f64)
          (local.get $base)
          (local.get $exponent)
          (f64.pow)
        )
        
        ;; Memory management functions
        (func $allocate_memory (param $size i32) (result i32)
          (local $ptr i32)
          (local $current_size i32)
          
          (memory.size)
          (i32.const 65536)
          (i32.mul)
          (local.set $current_size)
          
          (local.get $size)
          (local.get $current_size)
          (i32.gt_u)
          (if
            (then
              (local.get $size)
              (local.get $current_size)
              (i32.sub)
              (i32.const 65536)
              (i32.div_u)
              (i32.const 1)
              (i32.add)
              (memory.grow)
              (drop)
            )
          )
          
          (local.get $current_size)
        )
        
        ;; Export functions
        (export "string_length" (func $string_length))
        (export "string_search" (func $string_search))
        (export "compress_rle" (func $compress_rle))
        (export "fast_sqrt" (func $fast_sqrt))
        (export "fast_pow" (func $fast_pow))
        (export "allocate_memory" (func $allocate_memory))
      )
    `;
  }
  
  // Write string to WebAssembly memory
  writeString(str, ptr) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const memory = new Uint8Array(this.memoryBuffer.buffer);
    
    for (let i = 0; i < bytes.length; i++) {
      memory[ptr + i] = bytes[i];
    }
    memory[ptr + bytes.length] = 0; // Null terminator
    
    return bytes.length;
  }
  
  // Read string from WebAssembly memory
  readString(ptr, len) {
    const memory = new Uint8Array(this.memoryBuffer.buffer);
    const bytes = memory.slice(ptr, ptr + len);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }
  
  // Fast string search using WebAssembly
  searchString(text, pattern) {
    if (!this.isInitialized) {
      return this.fallbackStringSearch(text, pattern);
    }
    
    const startTime = performance.now();
    
    try {
      const textPtr = this.allocateMemory(text.length + 1);
      const patternPtr = this.allocateMemory(pattern.length + 1);
      
      this.writeString(text, textPtr);
      this.writeString(pattern, patternPtr);
      
      const result = this.wasmInstance.instance.exports.string_search(
        textPtr, text.length,
        patternPtr, pattern.length
      );
      
      const endTime = performance.now();
      this.performanceMetrics.wasmOperations++;
      this.performanceMetrics.wasmTime += (endTime - startTime);
      
      return result;
      
    } catch (error) {
      console.warn('WebAssembly string search failed, falling back to JS:', error);
      return this.fallbackStringSearch(text, pattern);
    }
  }
  
  // Fallback JavaScript string search
  fallbackStringSearch(text, pattern) {
    const startTime = performance.now();
    const result = text.indexOf(pattern);
    const endTime = performance.now();
    
    this.performanceMetrics.jsOperations++;
    this.performanceMetrics.jsTime += (endTime - startTime);
    
    return result;
  }
  
  // Fast data compression using WebAssembly
  compressData(data) {
    if (!this.isInitialized) {
      return this.fallbackCompression(data);
    }
    
    const startTime = performance.now();
    
    try {
      const inputPtr = this.allocateMemory(data.length);
      const outputPtr = this.allocateMemory(data.length * 2); // Worst case
      
      // Write input data
      const memory = new Uint8Array(this.memoryBuffer.buffer);
      for (let i = 0; i < data.length; i++) {
        memory[inputPtr + i] = data[i];
      }
      
      const compressedSize = this.wasmInstance.instance.exports.compress_rle(
        inputPtr, data.length, outputPtr
      );
      
      // Read compressed data
      const compressed = new Uint8Array(compressedSize);
      for (let i = 0; i < compressedSize; i++) {
        compressed[i] = memory[outputPtr + i];
      }
      
      const endTime = performance.now();
      this.performanceMetrics.wasmOperations++;
      this.performanceMetrics.wasmTime += (endTime - startTime);
      
      return compressed;
      
    } catch (error) {
      console.warn('WebAssembly compression failed, falling back to JS:', error);
      return this.fallbackCompression(data);
    }
  }
  
  // Fallback JavaScript compression
  fallbackCompression(data) {
    const startTime = performance.now();
    
    // Simple RLE compression
    const compressed = [];
    let count = 1;
    let current = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i] === current) {
        count++;
      } else {
        compressed.push(count, current);
        count = 1;
        current = data[i];
      }
    }
    compressed.push(count, current);
    
    const endTime = performance.now();
    this.performanceMetrics.jsOperations++;
    this.performanceMetrics.jsTime += (endTime - startTime);
    
    return new Uint8Array(compressed);
  }
  
  // Fast mathematical operations
  fastSqrt(x) {
    if (!this.isInitialized) {
      return Math.sqrt(x);
    }
    
    try {
      return this.wasmInstance.instance.exports.fast_sqrt(x);
    } catch (error) {
      return Math.sqrt(x);
    }
  }
  
  fastPow(base, exponent) {
    if (!this.isInitialized) {
      return Math.pow(base, exponent);
    }
    
    try {
      return this.wasmInstance.instance.exports.fast_pow(base, exponent);
    } catch (error) {
      return Math.pow(base, exponent);
    }
  }
  
  // Allocate memory in WebAssembly
  allocateMemory(size) {
    if (!this.isInitialized) {
      return 0;
    }
    
    try {
      return this.wasmInstance.instance.exports.allocate_memory(size);
    } catch (error) {
      console.warn('Failed to allocate WebAssembly memory:', error);
      return 0;
    }
  }
  
  // Get performance metrics
  getPerformanceMetrics() {
    const totalWasmTime = this.performanceMetrics.wasmTime;
    const totalJsTime = this.performanceMetrics.jsTime;
    const totalWasmOps = this.performanceMetrics.wasmOperations;
    const totalJsOps = this.performanceMetrics.jsOperations;
    
    return {
      wasmOperations: totalWasmOps,
      jsOperations: totalJsOps,
      wasmTime: totalWasmTime,
      jsTime: totalJsTime,
      wasmAvgTime: totalWasmOps > 0 ? totalWasmTime / totalWasmOps : 0,
      jsAvgTime: totalJsOps > 0 ? totalJsTime / totalJsOps : 0,
      speedup: totalJsTime > 0 ? totalJsTime / (totalWasmTime + 0.001) : 1
    };
  }
  
  // Check if WebAssembly is supported
  static isSupported() {
    return typeof WebAssembly !== 'undefined';
  }
  
  // Get WebAssembly information
  getInfo() {
    if (!this.isInitialized) {
      return { supported: false };
    }
    
    return {
      supported: true,
      memorySize: this.memoryBuffer.buffer.byteLength,
      maxMemorySize: this.memoryBuffer.buffer.byteLength * 16,
      performanceMetrics: this.getPerformanceMetrics()
    };
  }
  
  // Cleanup resources
  dispose() {
    if (this.memoryBuffer) {
      this.memoryBuffer = null;
    }
    this.wasmInstance = null;
    this.isInitialized = false;
  }
}
